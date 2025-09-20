import StarknetWalletManager from '@/src/features/wallet/services/StarknetWalletManager';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TransactionService } from '../services';
import { Transaction } from '../types';

const HistoryScreen = () => {
  const insets = useSafeAreaInsets();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const walletManager = StarknetWalletManager.getInstance();
  const transactionService = new TransactionService();

  const loadTransactions = async (isRefresh = false) => {
    const walletInfo = walletManager.getWalletInfo();
    if (!walletInfo?.address) {
      setError('Wallet not found');
      return;
    }

    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const txHistory = await transactionService.getTransactionHistory(walletInfo.address);
      setTransactions(txHistory);
    } catch (err: any) {
      console.error('Failed to load transactions:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const onRefresh = () => {
    loadTransactions(true);
  };

  const copyTxHash = async (hash: string) => {
    try {
      await Clipboard.setStringAsync(hash);
      showMessage({
        message: 'Copied!',
        description: 'Transaction hash copied to clipboard',
        type: 'success',
        duration: 2000,
      });
    } catch (error) {
      showMessage({
        message: 'Copy Failed',
        description: 'Unable to copy transaction hash',
        type: 'danger',
      });
    }
  };

  const openInExplorer = async (hash: string) => {
    try {
      const url = transactionService.getExplorerUrl(hash);
      await Linking.openURL(url);
    } catch (error) {
      showMessage({
        message: 'Error',
        description: 'Unable to open explorer',
        type: 'danger',
      });
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return `${minutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      const days = Math.floor(diffInHours / 24);
      return `${days}d ago`;
    }
  };

  return (
    <View className="flex-1 bg-white">
      <View 
        className="px-6 pb-4 bg-white border-b border-gray-100"
        style={{ paddingTop: insets.top }}
      >
        <Text className="text-2xl font-bold text-black">Transaction History</Text>
        <Text className="text-base text-gray-600 mt-1">View all your wallet transactions</Text>
      </View>

      <ScrollView 
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#000"
            colors={['#000']}
          />
        }
      >
        {isLoading ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="small" color="#000" />
            <Text className="mt-4 text-base text-gray-600">Loading transactions...</Text>
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center py-20 px-6">
            <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#EF4444" />
            <Text className="text-red-500 text-lg font-semibold mt-4 mb-2">Failed to load transactions</Text>
            <Text className="text-gray-600 text-center mb-6">{error}</Text>
            <TouchableOpacity 
              onPress={() => loadTransactions()}
              className="bg-black px-6 py-3 rounded-xl"
            >
              <Text className="text-white font-semibold">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : transactions.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20 px-6">
            <MaterialCommunityIcons name="history" size={48} color="#9CA3AF" />
            <Text className="text-gray-500 text-lg font-semibold mt-4 mb-2">No transactions yet</Text>
            <Text className="text-gray-400 text-center">
              Your transaction history will appear here once you start using your wallet
            </Text>
          </View>
        ) : (
          <View className="px-6 py-4">
            {transactions.map((tx) => (
              <TransactionItem 
                key={tx.hash}
                transaction={tx}
                onCopyHash={() => copyTxHash(tx.hash)}
                onOpenExplorer={() => openInExplorer(tx.hash)}
                formatDate={formatDate}
                transactionService={transactionService}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

// Transaction Item Component
type TransactionItemProps = {
  transaction: Transaction;
  onCopyHash: () => void;
  onOpenExplorer: () => void;
  formatDate: (timestamp: number) => string;
  transactionService: TransactionService;
};

const TransactionItem = ({ 
  transaction, 
  onCopyHash, 
  onOpenExplorer, 
  formatDate, 
  transactionService 
}: TransactionItemProps) => {
  const [showDetails, setShowDetails] = useState<boolean>(false);
  
  const typeColor = transactionService.getTransactionTypeColor(transaction.type);
  const typeIcon = transactionService.getTransactionTypeIcon(transaction.type);
  const formattedAmount = transactionService.formatAmount(transaction.amount, transaction.token);

  return (
    <View className="mb-4 bg-white border border-gray-100 rounded-xl overflow-hidden">
      {/* Main Transaction Info */}
      <TouchableOpacity 
        onPress={() => setShowDetails(!showDetails)}
        className="p-4"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <View 
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: typeColor + '20' }}
            >
              <MaterialCommunityIcons 
                name={typeIcon as any} 
                size={20} 
                color={typeColor} 
              />
            </View>
            
            <View className="flex">
              <View className="flex-row items-center gap-2">
                <Text className="font-semibold text-lg text-black capitalize">
                  {transaction.type}
                </Text>
                <View 
                  className={`px-2 py-1 rounded-full ${
                    transaction.status === 'success' ? 'bg-green-100' :
                    transaction.status === 'pending' ? 'bg-yellow-100' : 'bg-red-100'
                  }`}
                >
                  <Text className={`text-xs font-medium ${
                    transaction.status === 'success' ? 'text-green-700' :
                    transaction.status === 'pending' ? 'text-yellow-700' : 'text-red-700'
                  }`}>
                    {transaction.status}
                  </Text>
                </View>
              </View>
              <Text className="text-sm text-gray-600 mt-1">
                {formatDate(transaction.timestamp)}
              </Text>
            </View>
          </View>
          
          <View className="items-end">
            <Text 
              className={`font-semibold text-lg ${
                transaction.type === 'receive' ? 'text-green-600' : 
                transaction.type === 'send' ? 'text-red-600' : 'text-blue-600'
              }`}
            >
              {transaction.type === 'receive' ? '+' : transaction.type === 'send' ? '-' : ''}
              {formattedAmount}
            </Text>
            <MaterialCommunityIcons 
              name={showDetails ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#9CA3AF" 
            />
          </View>
        </View>
      </TouchableOpacity>

      {/* Expanded Details */}
      {showDetails && (
        <View className="px-4 pb-4 border-t border-gray-100">
          <View className="mt-4 space-y-3">
            {/* Transaction Hash */}
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-medium text-gray-700">Transaction Hash</Text>
              <View className="flex-row items-center gap-2">
                <Text className="text-sm font-mono text-gray-900">
                  {`${transaction.hash.slice(0, 8)}...${transaction.hash.slice(-6)}`}
                </Text>
                <TouchableOpacity onPress={onCopyHash}>
                  <MaterialCommunityIcons name="content-copy" size={16} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Block Number */}
            {transaction.blockNumber && (
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-medium text-gray-700">Block</Text>
                <Text className="text-sm text-gray-900">#{transaction.blockNumber}</Text>
              </View>
            )}

            {/* Gas Used */}
            {transaction.gasUsed && (
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-medium text-gray-700">Gas Used</Text>
                <Text className="text-sm text-gray-900">{transaction.gasUsed}</Text>
              </View>
            )}

            {/* Fee */}
            {transaction.actualFee && (
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-medium text-gray-700">Fee</Text>
                <Text className="text-sm text-gray-900">{transaction.actualFee} ETH</Text>
              </View>
            )}

            {/* From/To Addresses */}
            {transaction.from && transaction.type !== 'deploy' && (
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-medium text-gray-700">
                  {transaction.type === 'receive' ? 'From' : 'To'}
                </Text>
                <Text className="text-sm font-mono text-gray-900">
                  {transaction.type === 'receive' 
                    ? `${transaction.from.slice(0, 8)}...${transaction.from.slice(-6)}`
                    : `${transaction.to?.slice(0, 8)}...${transaction.to?.slice(-6)}`
                  }
                </Text>
              </View>
            )}

            {/* View in Explorer Button */}
            <TouchableOpacity 
              onPress={onOpenExplorer}
              className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-3 flex-row items-center justify-center gap-2"
            >
              <MaterialCommunityIcons name="open-in-new" size={16} color="#3B82F6" />
              <Text className="text-blue-600 font-semibold">View in Explorer</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

export default HistoryScreen;
