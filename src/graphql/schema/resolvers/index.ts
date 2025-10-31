import userResolvers from '@/graphql/schema/resolvers/user-resolvers';
import authResolvers from '@/graphql/schema/resolvers/auth-resolvers';
import workspaceResolvers from '@/graphql/schema/resolvers/workspace-resolvers';
import projectResolvers from '@/graphql/schema/resolvers/project-resolvers';

export default [
  userResolvers,
  authResolvers,
  workspaceResolvers,
  projectResolvers,
];
