import { gql } from 'apollo-server-express';

export default gql`
  type Project {
    id: String!
    title: String!
    description: String
    workspaceId: String!
    createdBy: String!
    createdAt: String!
    updatedAt: String!
    deletedAt: String
  }

  enum ProjectRole {
    LEAD
    CONTRIBUTOR
    VIEWER
  }

  type ProjectMembership {
    id: String
    projectId: String
    userId: String
    role: ProjectRole
  }

  type Query {
    getProjectById(id: String!): Project!
  }

  type Mutation {
    createProject(
      title: String!
      description: String
      workspaceId: String
    ): Project!
  }
`;
