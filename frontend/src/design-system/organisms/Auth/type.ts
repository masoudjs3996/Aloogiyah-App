export type LogFormValues = {
  userName: string;
  password: string;
};

export type RegFormValues = LogFormValues & {
  firstName: string;
  lastName: string;
  confirmPassword: string;
};
