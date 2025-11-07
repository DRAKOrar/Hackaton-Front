export interface RegisterUserRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  identityDocument: string;
  dateOfBirth: string; // "yyyy-MM-dd" (LocalDate en Spring)
}
