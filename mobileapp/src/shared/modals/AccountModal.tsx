import Appearance from '@/assets/images/appearance.svg';
import ChevronRight from '@/assets/images/arrow-right.svg';
import Currency from '@/assets/images/currency.svg';
import DotMenu from '@/assets/images/dot-vertical.svg';
import Logout from '@/assets/images/logout.svg';
import Notifications from '@/assets/images/notification.svg';
import Privacy from '@/assets/images/privacy.svg';
import { useAuth } from '@/src/features/auth/providers/auth';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Modal from 'react-native-modal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Avatar from '../components/Avatar';
import AppearanceModal from './AppearanceModal';
import ExportPrivateKeyModal from './ExportPrivateKeyModal';

const PREFERENCES = [
  {
    icon: <Appearance />,
    title: 'Appearance',
    description: 'System',
    isDotMenu: true,
  },
  {
    icon: <Currency />,
    title: 'Currency',
    description: 'USD',
    isDotMenu: true,
  },

  {
    icon: <Notifications />,
    title: 'Notifications',
  },

  {
    icon: <Privacy />,
    title: 'Privacy',
  },
];

const SETTINGS = [
  {
    icon: <MaterialCommunityIcons name="key" size={20} color="#EF4444" />,
    title: 'Export Private Key',
  },
  {
    icon: <Logout />,
    title: 'Logout',
  },
];

interface AccountModalProps {
  isOpen: boolean;
  closeModal: () => void;
}

const AccountModal = ({ isOpen, closeModal }: AccountModalProps) => {
  const insets = useSafeAreaInsets();

  const [isAppearance, setIsAppearance] = useState<boolean>(false);
  const [isExportPrivateKey, setIsExportPrivateKey] = useState<boolean>(false);
  const { signOut, user } = useAuth();

  const handlePreferencePress = async (title: string) => {
    switch (title) {
      case 'Appearance':
        setIsAppearance(true);
        break;
      case 'Currency':
        console.log('Currency pressed');
        break;
      case 'Notifications':
        console.log('Notifications pressed');
        break;
      case 'Privacy':
        console.log('Privacy pressed');
        break;
    }
  };

  const handleSettingsPress = async (title: string) => {
    switch (title) {
      case 'Export Private Key':
        setTimeout(() => {
          setIsExportPrivateKey(true);
        }, 200);
        break;
      case 'Logout':
        await signOut();
        closeModal();
        break;
    }
  };
  return (
    <Modal
      isVisible={isOpen}
      onBackdropPress={closeModal}
      onSwipeComplete={closeModal}
      swipeDirection={["down"]}
      swipeThreshold={100}
      propagateSwipe={true}
      style={{ margin: 0, marginTop: insets.top }}
    >
      <View
        className="absolute bottom-0 left-0 right-0 h-full w-full rounded-[28px] bg-white px-6 py-8"
        style={{ paddingTop: 16 }}
      >
        {/* Swipe Indicator */}
        <View className="items-center">
          <View className="h-1 w-12 rounded-full bg-gray-300" />
        </View>
        
        <View className="mt-10">
          <View className="header mb-6 w-full justify-end rounded-[16px]">
            <View className="flex-row items-center gap-2 rounded-2xl bg-gray-100 p-4">
              <Avatar
                name={user?.name || 'KK'}
                uri={user?.picture || ''}
                handlePress={() => {}}
              />

              <View className="flex-1">
                <Text className="text-2xl font-[600] text-black">
                  {user?.name || 'khalkos user'}
                </Text>
                <Text className="text-sm text-gray-500">
                  {user?.email || 'khalkos@user.com'}
                </Text>
              </View>
            </View>
          </View>

          <View className="body">
            <View className="field mb-8">
              <Text className="mb-4 font-semibold text-lg text-[#A1A1AA]">
                Preferences
              </Text>

              <View className="gap-8">
                {PREFERENCES.map((preference) => (
                  <AccountItem
                    key={preference.title}
                    icon={preference.icon}
                    title={preference.title}
                    description={preference.description}
                    isDotMenu={preference.isDotMenu}
                    onPress={() => handlePreferencePress(preference.title)}
                  />
                ))}
              </View>
            </View>

            <View className="field">
              <Text className="mb-4 font-semibold text-lg text-[#A1A1AA]">
                Settings
              </Text>

              <View className="gap-8">
                {SETTINGS.map((setting) => (
                  <AccountItem
                    key={setting.title}
                    icon={setting.icon}
                    title={setting.title}
                    onPress={() => handleSettingsPress(setting.title)}
                  />
                ))}
              </View>
            </View>
          </View>
        </View>

        <AppearanceModal
          isOpen={isAppearance}
          closeModal={() => setIsAppearance(false)}
        />
        
        <ExportPrivateKeyModal
          isOpen={isExportPrivateKey}
          closeModal={() => setIsExportPrivateKey(false)}
        />
      </View>
    </Modal>
  );
};

type AccountItemProps = {
  icon: React.ReactNode;
  title: string;
  description?: string;
  onPress?: () => void;
  isDotMenu?: boolean;
};

const AccountItem = ({
  icon,
  title,
  description,
  onPress,
  isDotMenu,
}: AccountItemProps) => {
  return (
    <TouchableOpacity onPress={onPress} className="">
      <View className="flex-row items-center justify-between gap-2">
        <View className="flex-row items-center gap-2">
          <View className="w-8 text-red-500">{icon}</View>
          <Text
            className={`font-semibold text-lg ${title == 'Export Private Key' ? 'text-red-500' : 'text-black'}`}
          >
            {title}
          </Text>
        </View>
        <View className="flex-row items-center gap-4">
          {description && (
            <Text className="font-semibold text-sm text-[#71717A]">
              {description}
            </Text>
          )}
          {isDotMenu ? <DotMenu /> : <ChevronRight />}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default AccountModal;
