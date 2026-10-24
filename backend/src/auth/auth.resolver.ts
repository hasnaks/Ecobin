import { Args, Field, Mutation, ObjectType, Resolver } from '@nestjs/graphql';
import { User } from '../entities';
import { AuthService } from './auth.service';

@ObjectType()
export class AuthPayload {
  @Field() token: string;
  @Field(() => User) user: User;
}

@Resolver()
export class AuthResolver {
  constructor(private auth: AuthService) {}

  @Mutation(() => AuthPayload)
  register(@Args('name') name: string, @Args('email') email: string, @Args('password') password: string) {
    return this.auth.register(name, email, password);
  }

  @Mutation(() => AuthPayload)
  login(@Args('email') email: string, @Args('password') password: string) {
    return this.auth.login(email, password);
  }

  @Mutation(() => AuthPayload)
  adminLogin(@Args('email') email: string, @Args('password') password: string) {
    return this.auth.adminLogin(email, password);
  }
}
