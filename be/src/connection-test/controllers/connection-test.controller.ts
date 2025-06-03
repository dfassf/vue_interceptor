import { Req, Controller, Get, HttpException, HttpStatus, Body, Post } from '@nestjs/common';
import { ConnectionTestService } from '../services/connection-test.service';

@Controller('connection-test')
export class ConnectionTestController {
    constructor(private readonly connectionTestService: ConnectionTestService) {}

  @Get('common')
  async connectionTest(@Req() req: Request) {
    try {
      return `hej värden, authorization: ${req.headers['authorization']}`;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('common')
  async connectionTestPost(@Req() req: Request, @Body() body: any) {
    try {
      return `hej värden, body: ${JSON.stringify(body)}`;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('error')
  async onerrorTest() {
    throw new HttpException('test', HttpStatus.INTERNAL_SERVER_ERROR);
  }

  @Get('unauthorized')
  async unauthorizedTest() {
    throw new HttpException('test', HttpStatus.UNAUTHORIZED);
  }

} 