import { gql } from 'apollo-server-express';

export default gql`
  type ForgotPasswordResponse {
    success: Boolean!
    message: String!
  }

  type ResetPasswordResponse {
    success: Boolean!
    message: String!
  }

  type Mutation {
    forgotPassword(email: String!): ForgotPasswordResponse!
    resetPassword(token: String!, password: String!): ResetPasswordResponse!
  }
`;
