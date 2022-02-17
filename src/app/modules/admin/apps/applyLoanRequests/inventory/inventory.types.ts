export interface ApplyLoanRequestModel {
  productId: string;
  serviceName: string;
  serviceDescription?: string;
  duration?: string;
  interestRate?: number;
  gracePeriod?: string;
  catId?: string;
  maxAmount?: string;

}

export interface ApplyLoanRequestsPagination {
  length: number;
  size: number;
  page: number;
  lastPage: number;
  startIndex: number;
  endIndex: number;
}
