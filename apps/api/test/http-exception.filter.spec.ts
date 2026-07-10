import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@cheetaxi/database';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockResponse: any;
  let mockRequest: any;
  let mockHost: any;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockRequest = {
      method: 'GET',
      url: '/test',
      headers: {},
    };
    mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    };
  });

  it('formats HttpException with message', () => {
    const ex = new HttpException('Not found', HttpStatus.NOT_FOUND);
    filter.catch(ex, mockHost);
    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ message: 'Not found' }),
      }),
    );
  });

  it('formats class-validator errors as VALIDATION_ERROR', () => {
    const ex = new HttpException(
      { message: ['field must be a string', 'field must be positive'], error: 'Bad Request', statusCode: 400 },
      HttpStatus.BAD_REQUEST,
    );
    filter.catch(ex, mockHost);
    const call = mockResponse.json.mock.calls[0][0];
    expect(call.error.code).toBe('VALIDATION_ERROR');
    expect(call.error.message).toContain('field must be a string');
  });

  it('formats Prisma unique constraint violation as CONFLICT', () => {
    const ex = new Prisma.PrismaClientKnownRequestError('Conflict', {
      code: 'P2002',
      clientVersion: '5.18.0',
      meta: { target: ['phone'] },
    });
    filter.catch(ex, mockHost);
    expect(mockResponse.status).toHaveBeenCalledWith(409);
    const call = mockResponse.json.mock.calls[0][0];
    expect(call.error.code).toBe('DUPLICATE_RESOURCE');
  });

  it('formats Prisma not-found error as 404', () => {
    const ex = new Prisma.PrismaClientKnownRequestError('Not found', {
      code: 'P2025',
      clientVersion: '5.18.0',
    });
    filter.catch(ex, mockHost);
    expect(mockResponse.status).toHaveBeenCalledWith(404);
    const call = mockResponse.json.mock.calls[0][0];
    expect(call.error.code).toBe('NOT_FOUND');
  });

  it('falls back to 500 for unknown errors', () => {
    const ex = new Error('Unexpected');
    filter.catch(ex, mockHost);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    const call = mockResponse.json.mock.calls[0][0];
    expect(call.error.code).toBe('INTERNAL_ERROR');
  });
});
