import { gql } from 'apollo-server-express';

export default gql`
  enum UserStatus {
    ACTIVE
    BANNED
  }

  type ForgotPasswordResponse {
    success: Boolean!
    message: String!
  }

  type ResetPasswordResponse {
    success: Boolean!
    message: String!
  }

  type BanUserResponse {
    success: Boolean!
    message: String!
    status: UserStatus!
    email: String!
  }

  type Mutation {
    forgotPassword(email: String!): ForgotPasswordResponse!
    resetPassword(token: String!, password: String!): ResetPasswordResponse!
    updateUserStatus(email: String!, status: UserStatus!): BanUserResponse!
  }
`;
