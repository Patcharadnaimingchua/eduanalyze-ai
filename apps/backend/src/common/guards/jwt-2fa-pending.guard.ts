import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class Jwt2faPendingGuard extends AuthGuard('jwt-2fa-pending') {}
