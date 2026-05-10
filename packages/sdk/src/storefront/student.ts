import type { ScopedClient } from '../client';
import type { StudentPassStatus, DiscountPreview } from '../types';
import type { ApplyStudentPassDto, PreviewStudentDiscountDto } from '../dto';

export function createStorefrontStudent(c: ScopedClient) {
  return {
    getPassStatus() {
      return c.get<StudentPassStatus>('/student/pass', 'enduser');
    },

    applyForPass(data: ApplyStudentPassDto) {
      return c.post<StudentPassStatus>('/student/pass', data, 'enduser');
    },

    previewDiscount(data: PreviewStudentDiscountDto) {
      return c.post<DiscountPreview>('/student/discount/preview', data, 'enduser');
    },
  };
}
