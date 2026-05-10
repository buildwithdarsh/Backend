import type { ScopedClient } from '../client';
import { createStorefrontAuth } from './auth';
import { createStorefrontCatalog } from './catalog';
import { createStorefrontCart } from './cart';
import { createStorefrontOrders } from './orders';
import { createStorefrontPayments } from './payments';
import { createStorefrontDelivery } from './delivery';
import { createStorefrontLocations } from './locations';
import { createStorefrontLoyalty } from './loyalty';
import { createStorefrontCoupons } from './coupons';
import { createStorefrontPromotions } from './promotions';
import { createStorefrontReferrals } from './referrals';
import { createStorefrontReviews } from './reviews';
import { createStorefrontGiftCards } from './gift-cards';
import { createStorefrontReservations } from './reservations';
import { createStorefrontSupport } from './support';
import { createStorefrontContent } from './content';
import { createStorefrontNotifications } from './notifications';
import { createStorefrontAddresses } from './addresses';
import { createStorefrontUpload } from './upload';
import { createStorefrontContact } from './contact';
import { createStorefrontConfig } from './config';
import { createStorefrontProperty } from './property';
import { createStorefrontMovies } from './movies';
import { createStorefrontTmdb } from './tmdb';
import { createStorefrontWallet } from './wallet';
import { createStorefrontStudent } from './student';
import { createStorefrontMealPlans } from './meal-plans';
import { createStorefrontHelp } from './help';
import { createStorefrontRooms } from './rooms';
import { createStorefrontEarnings } from './earnings';
import { createStorefrontConnectedSources } from './connected-sources';
import { createStorefrontBanking } from './banking';
import { createStorefrontSubRadar } from './sub-radar';
import { createStorefrontMarketplace } from './marketplace';
import { createStorefrontSubscriptions } from './subscriptions';

export function createStorefront(c: ScopedClient) {
  return {
    auth: createStorefrontAuth(c),
    catalog: createStorefrontCatalog(c),
    cart: createStorefrontCart(c),
    orders: createStorefrontOrders(c),
    payments: createStorefrontPayments(c),
    delivery: createStorefrontDelivery(c),
    locations: createStorefrontLocations(c),
    loyalty: createStorefrontLoyalty(c),
    coupons: createStorefrontCoupons(c),
    promotions: createStorefrontPromotions(c),
    referrals: createStorefrontReferrals(c),
    reviews: createStorefrontReviews(c),
    giftCards: createStorefrontGiftCards(c),
    reservations: createStorefrontReservations(c),
    support: createStorefrontSupport(c),
    content: createStorefrontContent(c),
    notifications: createStorefrontNotifications(c),
    addresses: createStorefrontAddresses(c),
    upload: createStorefrontUpload(c),
    contact: createStorefrontContact(c),
    config: createStorefrontConfig(c),
    property: createStorefrontProperty(c),
    movies: createStorefrontMovies(c),
    tmdb: createStorefrontTmdb(c),
    wallet: createStorefrontWallet(c),
    student: createStorefrontStudent(c),
    mealPlans: createStorefrontMealPlans(c),
    help: createStorefrontHelp(c),
    rooms: createStorefrontRooms(c),
    earnings: createStorefrontEarnings(c),
    connectedSources: createStorefrontConnectedSources(c),
    banking: createStorefrontBanking(c),
    subRadar: createStorefrontSubRadar(c),
    marketplace: createStorefrontMarketplace(c),
    subscriptions: createStorefrontSubscriptions(c),
  };
}
