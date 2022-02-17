export interface LoanRequestModel {
  id: string;
  status?: string;
  fee?: string;
  amount: string;
  dueDate?: Date;
  updatedDate?: Date;
  paymentDTO?: {
    transactionId?: string;
    transactionAmount?: number;
    transactionStatus?: string;
    createdDate?: Date;
  };
  loanProductDTO?: {
    serviceName?: string;
    serviceDescription?: string;
    duration?: number;
    interestRate?: number;
    gracePeriod?: number;
  };
  userProfileDTO?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    taxID?: string;
    creditRating?: number;
  };
}

export interface LoanRequestsPagination {
  length: number;
  size: number;
  page: number;
  lastPage: number;
  startIndex: number;
  endIndex: number;
}
