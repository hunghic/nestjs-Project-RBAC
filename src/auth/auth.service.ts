import { MailService } from './../notifications/mail/mail.service';
import { AccountType, User } from '@prisma/client';
import { Token } from './types/tokens.type';
import { RegisterDto } from './dto';
import { PrismaService } from '../prisma/prisma.service';
import { hashData, compareData } from '../common/helper/bcrypt';
import { hashDataArgon, verifyDataArgon } from '../common/helper/argon';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyConfirmEmailToken,
  verifyRefreshToken,
} from '../common/helper/jwt';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  private _generateToken(
    userId: number,
    identifier: string,
    tfaEnabled: boolean,
    tfaVerified: boolean | null = null,
  ): Token {
    const payload =
      tfaVerified === null
        ? {
            sub: userId,
            email: identifier,
            tfaEnabled,
          }
        : {
            sub: userId,
            email: identifier,
            tfaEnabled,
            tfaVerified,
          };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async _updateUserToken(userId: number, tokens: Token): Promise<void> {
    const accessToken = await hashDataArgon(tokens.accessToken);
    const refreshToken = await hashDataArgon(tokens.refreshToken);
    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        accessToken,
        refreshToken,
      },
    });
  }

  async register({ email, password, fullname }: RegisterDto): Promise<any> {
    try {
      const existedUser = await this.prisma.user.findUnique({
        where: {
          email,
        },
      });

      if (existedUser && existedUser.accountVerified) {
        throw new BadRequestException('Email already exists');
      }

      if (existedUser && !existedUser.accountVerified) {
        await this.prisma.user.delete({
          where: {
            id: existedUser.id,
          },
        });
      }

      const hashedPassword = hashData(password);
      const newUser = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          fullname,
        },
      });

      this.mailService.accountConfirmation(newUser);

      return {
        message: `Register account successfully, you must verify your account via email '${newUser.email}' in 7 days`,
      };
    } catch (error) {
      throw error;
    }
  }

  async loginWithUserId({ id, password }): Promise<any> {
    try {
      const user: User = await this.prisma.user.findUnique({
        where: {
          id,
        },
      });

      if (!user) {
        throw new UnauthorizedException('Account does not exist');
      }

      const isPasswordRight = compareData(password, user.password);

      if (!isPasswordRight) {
        throw new UnauthorizedException('Wrong password');
      }

      if (!user.accountVerified) {
        throw new ForbiddenException('Your account is not verified');
      }

      const tokens: Token = this._generateToken(
        user.id,
        user.email,
        user.tfaEnabled,
        user.tfaEnabled ? false : null,
      );

      await this._updateUserToken(user.id, tokens);

      return tokens;
    } catch (error) {
      throw error;
    }
  }

  async loginWithEmail({ email, password }): Promise<any> {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          email,
        },
      });

      if (!user) {
        throw new UnauthorizedException('Email does not exist');
      }

      if (user.accountType !== 'NormalAccount') {
        throw new UnauthorizedException('Cannot login by email');
      }

      const isPasswordRight = compareData(password, user.password);

      if (!isPasswordRight) {
        throw new UnauthorizedException('Wrong password');
      }

      if (!user.accountVerified) {
        throw new ForbiddenException('Your account is not verified');
      }

      const tokens: Token = this._generateToken(
        user.id,
        user.email,
        user.tfaEnabled,
        user.tfaEnabled ? false : null,
      );

      await this._updateUserToken(user.id, tokens);

      return {
        message: 'Login successfully!',
        ...tokens,
      };
    } catch (error) {
      throw error;
    }
  }

  async loginWithUserName({ username, password }): Promise<any> {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          username,
        },
      });

      if (!user || !user.password) {
        throw new UnauthorizedException(
          'Username does not exist or password has not been setting',
        );
      }

      const isPasswordRight = compareData(password, user.password);

      if (!isPasswordRight) {
        throw new UnauthorizedException('Wrong password');
      }

      if (!user.accountVerified) {
        throw new ForbiddenException('Your account is not verified');
      }

      const tokens: Token = this._generateToken(
        user.id,
        user.email,
        user.tfaEnabled,
        user.tfaEnabled ? false : null,
      );

      await this._updateUserToken(user.id, tokens);

      return {
        message: 'Login successfully!',
        ...tokens,
      };
    } catch (error) {
      throw error;
    }
  }

  async loginWithGoogle(googleId: string, googleName?: string): Promise<any> {
    try {
      const existedGoogleUser = await this.prisma.user.findFirst({
        where: {
          googleId,
          accountType: 'GoogleAccount',
        },
      });

      if (existedGoogleUser) {
        const tokens = this._generateToken(
          existedGoogleUser.id,
          existedGoogleUser.googleId,
          existedGoogleUser.tfaEnabled,
          existedGoogleUser.tfaEnabled ? false : null,
        );

        await this._updateUserToken(existedGoogleUser.id, tokens);

        return {
          message: 'Login by Google successfully!',
          ...tokens,
        };
      }

      const newUser = await this.prisma.user.create({
        data: {
          googleId,
          fullname: googleName,
          accountVerified: true,
          accountType: 'GoogleAccount',
        },
      });

      const tokens = this._generateToken(
        newUser.id,
        newUser.googleId,
        newUser.tfaEnabled,
      );

      await this._updateUserToken(newUser.id, tokens);

      return {
        message: 'Login by Google successfully!',
        ...tokens,
      };
    } catch (error) {
      throw error;
    }
  }

  async loginWithGithub(githubId: string, githubName?: string): Promise<any> {
    try {
      const existedGithubUser = await this.prisma.user.findFirst({
        where: {
          githubId,
          accountType: 'GithubAccount',
        },
      });

      if (existedGithubUser) {
        const tokens = this._generateToken(
          existedGithubUser.id,
          existedGithubUser.githubId,
          existedGithubUser.tfaEnabled,
          existedGithubUser.tfaEnabled ? false : null,
        );

        await this._updateUserToken(existedGithubUser.id, tokens);

        return {
          message: 'Login by Github successfully!',
          ...tokens,
        };
      }

      const newUser = await this.prisma.user.create({
        data: {
          githubId,
          fullname: githubName,
          accountVerified: true,
          accountType: 'GithubAccount',
        },
      });

      const tokens = this._generateToken(
        newUser.id,
        newUser.githubId,
        newUser.tfaEnabled,
      );

      await this._updateUserToken(newUser.id, tokens);

      return {
        message: 'Login by Github successfully!',
        ...tokens,
      };
    } catch (error) {
      throw error;
    }
  }

  async logout(userId: number): Promise<any> {
    try {
      await this.prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          accessToken: null,
          refreshToken: null,
        },
      });

      return {
        message: 'Loggout successfully!',
      };
    } catch (error) {
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<Token> {
    try {
      const payload = verifyRefreshToken(refreshToken);

      const user: User = await this.prisma.user.findUnique({
        where: {
          id: payload.sub,
        },
      });

      if (!user || !(await verifyDataArgon(user.refreshToken, refreshToken)))
        throw new UnauthorizedException('Refresh token no longer available');

      const tokens = this._generateToken(
        user.id,
        user.email,
        user.tfaEnabled,
        user.tfaEnabled ? payload.tfaVerified : null,
      );

      await this._updateUserToken(user.id, tokens);

      return tokens;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      } else {
        throw new ForbiddenException('Cannot refresh token');
      }
    }
  }

  async verifyAccount(token: string): Promise<any> {
    try {
      const payload = verifyConfirmEmailToken(token);

      const user: User = await this.prisma.user.findUnique({
        where: {
          id: payload.userId,
        },
      });

      if (!user) throw new UnauthorizedException('Email not existed!');

      if (user.accountVerified) {
        return {
          message: `This email has been verified, you don't need to do this anymore.`,
        };
      }

      await this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          accountVerified: true,
        },
      });

      return {
        message:
          'Verify email successfully, you can already use this email to login your account',
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      } else {
        throw new ForbiddenException(error.message || 'Cannot verify email');
      }
    }
  }

  async getNewUserToken(user: User, tfaVerified?: boolean): Promise<Token> {
    try {
      let identifier: string;
      switch (user.accountType) {
        case AccountType.NormalAccount: {
          identifier = user.email;
          break;
        }
        case AccountType.GoogleAccount: {
          identifier = user.googleId;
          break;
        }
        case AccountType.GithubAccount: {
          identifier = user.githubId;
          break;
        }
      }

      let tokens: Token;

      if (!user.tfaEnabled)
        tokens = this._generateToken(user.id, identifier, user.tfaEnabled);
      else
        tokens = this._generateToken(
          user.id,
          identifier,
          user.tfaEnabled,
          tfaVerified,
        );
      await this._updateUserToken(user.id, tokens);

      return tokens;
    } catch (error) {
      throw error;
    }
  }
}
