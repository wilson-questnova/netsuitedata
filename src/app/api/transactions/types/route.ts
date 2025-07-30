import { getDataSource } from '../../../../lib/db';
import { Transaction } from '../../../../entity/Transaction';

/**
 * GET /api/transactions/types
 * Returns all unique transaction types for filtering dropdown
 */
export async function GET() {
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