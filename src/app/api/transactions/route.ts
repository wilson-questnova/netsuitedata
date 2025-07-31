import { NextRequest } from 'next/server';
import { Between, MoreThanOrEqual, LessThanOrEqual, FindOptionsWhere } from 'typeorm';
import { Transaction } from '../../../entity/Transaction';
import { getDataSource } from '../../../lib/db';

/**
 * GET /api/transactions
 * Retrieves transactions with optional filtering and pagination
 * Query parameters:
 * - query: Search term for document number, name, or serial number
 * - serialNumber: Filter by serial number
 * - type: Filter by transaction type
 * - fromDate: Filter transactions from this date (YYYY-MM-DD)
 * - toDate: Filter transactions to this date (YYYY-MM-DD)
 * - limit: Number of records to return (default: 100)
 * - offset: Number of records to skip (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const serialNumber = searchParams.get('serialNumber') || '';
    const serialOnly = searchParams.get('serialOnly') === 'true';
    const type = searchParams.get('type') || '';
    const fromDate = searchParams.get('fromDate') || '';
    const toDate = searchParams.get('toDate') || '';
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const dataSource = await getDataSource();
    const transactionRepository = dataSource.getRepository(Transaction);

    const where: FindOptionsWhere<Transaction> = {};
    
    // If serialOnly is true, only filter by serial number
    if (serialOnly && serialNumber) {
      const queryBuilder = transactionRepository.createQueryBuilder('transaction');
      queryBuilder.where('transaction.serialNumber LIKE :serialNumber', { serialNumber: `%${serialNumber}%` });
      
      // Get total count
      const totalCount = await queryBuilder.getCount();
      
      // Get paginated results
      const transactions = await queryBuilder
        .orderBy('transaction.date', 'DESC')
        .addOrderBy('transaction.id', 'DESC')
        .take(limit)
        .skip(offset)
        .getMany();
      
      return Response.json({
        transactions,
        totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      });
    }
    
    // Search filter - search in document number, name, memo, and serial number
    if (query || serialNumber) {
      // For complex search, we'll use query builder
      const queryBuilder = transactionRepository.createQueryBuilder('transaction');
      
      if (query) {
        queryBuilder.where(
          '(transaction.documentNumber LIKE :query OR transaction.name LIKE :query OR transaction.memo LIKE :query OR transaction.serialNumber LIKE :query)',
          { query: `%${query}%` }
        );
      }
      
      if (serialNumber) {
        if (query) {
          queryBuilder.andWhere('transaction.serialNumber LIKE :serialNumber', { serialNumber: `%${serialNumber}%` });
        } else {
          queryBuilder.where('transaction.serialNumber LIKE :serialNumber', { serialNumber: `%${serialNumber}%` });
        }
      }
      
      // Add type filter
      if (type && type !== 'all') {
        queryBuilder.andWhere('transaction.type = :type', { type });
      }
      
      // Add date filters
      if (fromDate && toDate) {
        queryBuilder.andWhere('DATE(transaction.date) BETWEEN :fromDate AND :toDate', {
          fromDate: fromDate,
          toDate: toDate
        });
      } else if (fromDate) {
        queryBuilder.andWhere('DATE(transaction.date) >= :fromDate', {
          fromDate: fromDate
        });
      } else if (toDate) {
        queryBuilder.andWhere('DATE(transaction.date) <= :toDate', {
          toDate: toDate
        });
      }
      
      // Get total count
      const totalCount = await queryBuilder.getCount();
      
      // Get paginated results
      const transactions = await queryBuilder
        .orderBy('transaction.date', 'DESC')
        .addOrderBy('transaction.id', 'DESC')
        .take(limit)
        .skip(offset)
        .getMany();
      
      return Response.json({
        transactions,
        totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      });
    }
    
    // Simple filtering without search query
    if (type && type !== 'all') {
      where.type = type;
    }
    
    // Handle date filtering
    if (fromDate && toDate) {
      where.date = Between(fromDate, toDate);
    } else if (fromDate) {
      where.date = MoreThanOrEqual(fromDate);
    } else if (toDate) {
      where.date = LessThanOrEqual(toDate);
    }

    // Get total count of filtered records
    const totalCount = await transactionRepository.count({ where });

    // Get paginated results
    const transactions = await transactionRepository.find({
      where,
      order: {
        date: 'DESC',
        id: 'DESC',
      },
      take: limit,
      skip: offset,
    });

    return Response.json({
      transactions,
      totalCount,
      limit,
      offset,
      hasMore: offset + limit < totalCount
    });

  } catch (error) {
    console.error('Error fetching transactions:', error);
    return Response.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/transactions/types
 * Returns all unique transaction types for filtering
 */
export async function OPTIONS() {
  try {
    const dataSource = await getDataSource();
    const transactionRepository = dataSource.getRepository(Transaction);
    
    const types = await transactionRepository
      .createQueryBuilder('transaction')
      .select('DISTINCT transaction.type', 'type')
      .where('transaction.type IS NOT NULL AND transaction.type != ""')
      .orderBy('transaction.type', 'ASC')
      .getRawMany();
    
    return Response.json({
      types: types.map(t => t.type)
    });
    
  } catch (error) {
    console.error('Error fetching transaction types:', error);
    return Response.json(
      { error: 'Failed to fetch transaction types' },
      { status: 500 }
    );
  }
}