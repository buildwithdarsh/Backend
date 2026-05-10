import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { ConversationState, type ConversationStateType } from './conversation-states.js';

interface IncomingMessage {
  text: string;
  messageType: string;
  externalMessageId?: string;
}

interface OutboundMessage {
  text: string;
}

@Injectable()
export class ConversationFsmService {
  private readonly logger = new Logger(ConversationFsmService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Public API ──────────────────────────────────────────────────────────

  /**
   * Main entry point: find or create the session, route to the current
   * state handler, persist state changes, and return response message(s).
   */
  async handleIncomingMessage(
    orgId: string,
    channel: string,
    identifier: string,
    message: IncomingMessage,
  ): Promise<OutboundMessage[]> {
    const session = await this.findOrCreateSession(orgId, channel, identifier);

    // Persist inbound message
    await this.prisma.conversationMessage.create({
      data: {
        orgId,
        sessionId: session.id,
        direction: 'inbound',
        externalMessageId: message.externalMessageId ?? null,
        content: message.text,
        messageType: message.messageType,
      },
    });

    // Check for global reset command
    if (message.text.trim().toLowerCase() === '/reset') {
      return this.resetSession(orgId, channel, identifier);
    }

    // Route to state handler
    const state = session.state as ConversationStateType;
    const responses = await this.routeToHandler(state, orgId, session.id, message);

    // Persist outbound messages
    for (const resp of responses) {
      await this.prisma.conversationMessage.create({
        data: {
          orgId,
          sessionId: session.id,
          direction: 'outbound',
          content: resp.text,
          messageType: 'text',
        },
      });
    }

    // Update last activity
    await this.prisma.conversationSession.update({
      where: { id: session.id },
      data: { lastActivity: new Date() },
    });

    return responses;
  }

  /**
   * Reset the session back to idle state.
   */
  async resetSession(
    orgId: string,
    channel: string,
    identifier: string,
  ): Promise<OutboundMessage[]> {
    const session = await this.prisma.conversationSession.findUnique({
      where: { orgId_channel_identifier: { orgId, channel, identifier } },
    });

    if (session) {
      await this.prisma.conversationSession.update({
        where: { id: session.id },
        data: {
          state: ConversationState.IDLE,
          cartData: {},
          orderType: null,
          addressText: null,
          paymentType: null,
          paymentLinkId: null,
          locationId: null,
          lastActivity: new Date(),
        },
      });

      this.logger.log(`Session ${session.id} reset to idle`);
    }

    return [{ text: 'Session reset. Send "hi" to start a new order.' }];
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────

  private async findOrCreateSession(orgId: string, channel: string, identifier: string) {
    const existing = await this.prisma.conversationSession.findUnique({
      where: { orgId_channel_identifier: { orgId, channel, identifier } },
    });

    if (existing) {
      return existing;
    }

    const session = await this.prisma.conversationSession.create({
      data: {
        orgId,
        channel,
        identifier,
        state: ConversationState.IDLE,
      },
    });

    this.logger.log(`Created new session ${session.id} for ${channel}:${identifier}`);
    return session;
  }

  private async routeToHandler(
    state: ConversationStateType,
    orgId: string,
    sessionId: string,
    message: IncomingMessage,
  ): Promise<OutboundMessage[]> {
    switch (state) {
      case ConversationState.IDLE:
        return this.handleIdle(orgId, sessionId, message);
      case ConversationState.STORE_SELECT:
        return this.handleStoreSelect(orgId, sessionId, message);
      case ConversationState.BROWSING:
        return this.handleBrowsing(orgId, sessionId, message);
      case ConversationState.CART:
        return this.handleCart(orgId, sessionId, message);
      case ConversationState.ORDER_TYPE:
        return this.handleOrderType(orgId, sessionId, message);
      case ConversationState.ADDRESS_PENDING:
        return this.handleAddressPending(orgId, sessionId, message);
      case ConversationState.PAYMENT:
        return this.handlePayment(orgId, sessionId, message);
      case ConversationState.PLACING:
        return this.handlePlacing(orgId, sessionId, message);
      case ConversationState.TRACKING:
        return this.handleTracking(orgId, sessionId, message);
      default:
        this.logger.warn(`Unknown state "${state}" for session ${sessionId}, resetting to idle`);
        await this.prisma.conversationSession.update({
          where: { id: sessionId },
          data: { state: ConversationState.IDLE },
        });
        return [{ text: 'Something went wrong. Send "hi" to start over.' }];
    }
  }

  // ─── State Handlers (stubs) ──────────────────────────────────────────────

  private async handleIdle(
    _orgId: string,
    sessionId: string,
    _message: IncomingMessage,
  ): Promise<OutboundMessage[]> {
    await this.prisma.conversationSession.update({
      where: { id: sessionId },
      data: { state: ConversationState.STORE_SELECT },
    });

    return [
      {
        text: 'Welcome! Please select a store location to begin ordering. Reply with the store number.',
      },
    ];
  }

  private async handleStoreSelect(
    _orgId: string,
    sessionId: string,
    _message: IncomingMessage,
  ): Promise<OutboundMessage[]> {
    // TODO: validate store selection, load menu
    await this.prisma.conversationSession.update({
      where: { id: sessionId },
      data: { state: ConversationState.BROWSING },
    });

    return [{ text: 'Store selected. Browse our menu and reply with item numbers to add to cart.' }];
  }

  private async handleBrowsing(
    _orgId: string,
    sessionId: string,
    _message: IncomingMessage,
  ): Promise<OutboundMessage[]> {
    // TODO: parse item selection, add to cart
    await this.prisma.conversationSession.update({
      where: { id: sessionId },
      data: { state: ConversationState.CART },
    });

    return [{ text: 'Item added to cart. Reply "checkout" to proceed or continue adding items.' }];
  }

  private async handleCart(
    _orgId: string,
    sessionId: string,
    _message: IncomingMessage,
  ): Promise<OutboundMessage[]> {
    // TODO: show cart summary, handle modifications
    await this.prisma.conversationSession.update({
      where: { id: sessionId },
      data: { state: ConversationState.ORDER_TYPE },
    });

    return [{ text: 'Your cart is ready. Reply "delivery" or "pickup" to choose your order type.' }];
  }

  private async handleOrderType(
    _orgId: string,
    sessionId: string,
    _message: IncomingMessage,
  ): Promise<OutboundMessage[]> {
    // TODO: validate order type selection
    await this.prisma.conversationSession.update({
      where: { id: sessionId },
      data: { state: ConversationState.ADDRESS_PENDING },
    });

    return [{ text: 'Please share your delivery address.' }];
  }

  private async handleAddressPending(
    _orgId: string,
    sessionId: string,
    _message: IncomingMessage,
  ): Promise<OutboundMessage[]> {
    // TODO: save address text
    await this.prisma.conversationSession.update({
      where: { id: sessionId },
      data: { state: ConversationState.PAYMENT },
    });

    return [{ text: 'Address saved. Choose payment method: "cod" or "online".' }];
  }

  private async handlePayment(
    _orgId: string,
    sessionId: string,
    _message: IncomingMessage,
  ): Promise<OutboundMessage[]> {
    // TODO: handle payment selection, generate payment link if online
    await this.prisma.conversationSession.update({
      where: { id: sessionId },
      data: { state: ConversationState.PLACING },
    });

    return [{ text: 'Placing your order...' }];
  }

  private async handlePlacing(
    _orgId: string,
    sessionId: string,
    _message: IncomingMessage,
  ): Promise<OutboundMessage[]> {
    // TODO: create commerce order, reset session
    await this.prisma.conversationSession.update({
      where: { id: sessionId },
      data: { state: ConversationState.IDLE },
    });

    return [{ text: 'Your order has been placed! You will receive updates here. Send "hi" to order again.' }];
  }

  private async handleTracking(
    _orgId: string,
    _sessionId: string,
    _message: IncomingMessage,
  ): Promise<OutboundMessage[]> {
    // TODO: look up latest order and return status
    return [{ text: 'Your order is being prepared. We will notify you when it is ready.' }];
  }
}
