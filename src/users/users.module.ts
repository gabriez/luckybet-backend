import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRepoService } from './adapters/driven/UserRepo.service';
import { UsersController } from './adapters/driver/users.controller';
import { USER_CORE_PROVIDER } from './app/constants';
import { User } from './app/entities/user.entity';
import { UsersCore } from './app/usersCore';
import { ForDatabaseUsers } from './ports/driver/ForDatabaseUsers';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [
    UserRepoService,
    {
      provide: USER_CORE_PROVIDER,
      useFactory: (repo: ForDatabaseUsers) => new UsersCore(repo),
      inject: [UserRepoService],
    },
  ],
  exports: [UserRepoService],
})
export class UsersModule {}
