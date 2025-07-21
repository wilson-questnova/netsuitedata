import 'reflect-metadata';
import { NextRequest, NextResponse } from 'next/server';
import { Like, Between, MoreThanOrEqual, LessThanOrEqual, FindOptionsWhere } from 'typeorm';
import { PurchaseOrder } from '../../../entity/PurchaseOrder';
import { getDataSource } from '../../../lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const status = searchParams.get('status') || '';
    const fromDate = searchParams.get('fromDate') || '';
    const toDate = searchParams.get('toDate') || '';
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const dataSource = await getDataSource();
    const purchaseOrderRepository = dataSource.getRepository(PurchaseOrder);

    const where: FindOptionsWhere<PurchaseOrder> = {};
    if (query) {
      where.documentNumber = Like(`%${query}%`);
    }
    if (status && status !== 'all') {
      where.status = status;
    }
    
    // Handle date filtering
    if (fromDate && toDate) {
      // Both dates provided - filter between dates (inclusive)
      where.date = Between(new Date(fromDate), new Date(toDate + 'T23:59:59.999Z'));
    } else if (fromDate) {
      // Only from date provided - filter from date onwards
      where.date = MoreThanOrEqual(new Date(fromDate));
    } else if (toDate) {
      // Only to date provided - filter up to date
      where.date = LessThanOrEqual(new Date(toDate + 'T23:59:59.999Z'));
    }

    // Get total count of filtered records
    const totalCount = await purchaseOrderRepository.count({ where });

    // Get paginated results
    const purchaseOrders = await purchaseOrderRepository.find({
      where,
      order: {
        id: 'DESC',
      },
      take: limit,
      skip: offset,
    });

    return NextResponse.json({
      purchaseOrders,
      hasMore: offset + purchaseOrders.length < totalCount,
      total: totalCount,
      currentPage: purchaseOrders.length,
      offset,
      limit
    });
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch purchase orders' },
      { status: 500 }
    );
  }
}