import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Modal from 'react-native-modal';
import Avatar from '../main/Avatar';

import Appearance from '@/assets/images/appearance.svg';
import ChevronRight from '@/assets/images/arrow-right.svg';
import Currency from '@/assets/images/currency.svg';
import DotMenu from '@/assets/images/dot-vertical.svg';
import Notifications from '@/assets/images/notification.svg';
import Privacy from '@/assets/images/privacy.svg';

import FaceId from '@/assets/images/face-id.svg';
import KeyChain from '@/assets/images/key-chain.svg';
import Logout from '@/assets/images/logout.svg';

import { useAuth } from '@/src/features/auth/providers/auth';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppearanceModal from './AppearanceModal';

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
    icon: <FaceId />,
    title: 'Face ID',
  },
  {
    icon: <KeyChain />,
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
  const { signOut } = useAuth();

  const handlePreferencePress = async (index: number) => {
    switch (index) {
      case 0:
        setIsAppearance(!isAppearance);
        break;
      case 1:
        break;
      case 2:
        await signOut();
        break;
    }
  };
  return (
    <Modal
      isVisible={isOpen}
      onBackdropPress={closeModal}
      style={{ margin: 0, marginTop: insets.top }}
    >
      <View
        className="absolute bottom-0 left-0 right-0 h-full w-full rounded-[28px] bg-white px-6 py-8"
        style={{ paddingTop: 16 }}
      >
        <View className="">
          <View className="header mb-6 h-40 w-full justify-end rounded-[16px] bg-gray-100 p-4">
            <TouchableOpacity
              onPress={closeModal}
              className="absolute right-4 top-4"
            >
              <MaterialCommunityIcons name="close" size={24} color="black" />
            </TouchableOpacity>

            <View className="flex-row items-center gap-2">
              <Avatar name="Emmanuel Chris" handlePress={() => {}} size={14} />

              <View className="flex-1">
                <Text className="text-2xl font-[600] text-black">
                  Emmanuel Chris
                </Text>
                <Text className="text-sm text-gray-500">
                  emmanuel@gmail.com
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
                {PREFERENCES.map((preference, index) => (
                  <AccountItem
                    key={preference.title}
                    icon={preference.icon}
                    title={preference.title}
                    description={preference.description}
                    isDotMenu={preference.isDotMenu}
                    onPress={() => handlePreferencePress(index)}
                  />
                ))}
              </View>
            </View>

            <View className="field">
              <Text className="mb-4 font-semibold text-lg text-[#A1A1AA]">
                Settings
              </Text>

              <View className="gap-8">
                {SETTINGS.map((preference, index) => (
                  <AccountItem
                    key={preference.title}
                    icon={preference.icon}
                    title={preference.title}
                    onPress={() => handlePreferencePress(index)}
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
    <View className="flex-row items-center justify-between gap-2">
      <View className="flex-row items-center gap-2">
        <View className="w-8">{icon}</View>
        <Text className="font-semibold text-lg text-black">{title}</Text>
      </View>

      <TouchableOpacity
        onPress={onPress}
        className="flex-row items-center gap-4"
      >
        {description && (
          <Text className="font-semibold text-sm text-[#71717A]">
            {description}
          </Text>
        )}
        {isDotMenu ? <DotMenu /> : <ChevronRight />}
      </TouchableOpacity>
    </View>
  );
};

export default AccountModal;
