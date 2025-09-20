import { useAuth } from '@/src/features/auth/providers/auth';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AccountModal } from '../modals';
import Avatar from './Avatar';

const Navbar = () => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [isAccountModalOpen, setIsAccountModalOpen] = useState<boolean>(false);

  return (
    <>
      <View
        className="flex-row items-center justify-between px-6 pb-2"
        style={{ paddingTop: insets.top }}
      >
        <Avatar
          name={user?.name || 'KK'}
          uri={user?.picture || ''}
          handlePress={() => setIsAccountModalOpen(true)}
        />

        <View className="flex-row items-center gap-4">
          <MaterialCommunityIcons
            name="line-scan"
            size={24}
            color={'#71717A'}
          />
        </View>
      </View>

      <AccountModal
        isOpen={isAccountModalOpen}
        closeModal={() => {
            setTimeout(() => {
                setIsAccountModalOpen(false)
            }, 200);
        }}
      />
    </>
  );
};

export default Navbar;
