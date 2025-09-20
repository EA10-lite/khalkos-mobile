import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import { Pressable, Text, TouchableOpacity, View } from 'react-native';
import Modal from 'react-native-modal';

import { useState } from 'react';

interface AppearanceModalProps {
  isOpen: boolean;
  closeModal: () => void;
}

const APPEARANCE_ITEMS = [
  {
    title: 'System',
    icon: 'sun' as const,
  },
  {
    title: 'Light',
    icon: 'sun' as const,
  },
  {
    title: 'Dark',
    icon: 'moon' as const,
  },
];

const AppearanceModal = ({ isOpen, closeModal }: AppearanceModalProps) => {
  const [appearance, setAppearance] = useState<string>('system');

  return (
    <Modal isVisible={isOpen} onBackdropPress={closeModal}>
      <View className="absolute bottom-0 left-0 right-0 w-full rounded-[28px] bg-white p-6">
        <View className="mb-4 flex-row items-center justify-between gap-2">
          <Text className="text-2xl font-[600] text-black">Appearance</Text>

          <TouchableOpacity onPress={closeModal}>
            <MaterialIcons
              name="close"
              size={24}
              color="black"
              className="ml-[8px]"
            />
          </TouchableOpacity>
        </View>

        <View className="rounded-[16px] bg-[#18181B05] p-4">
          <View className="flex-row items-center justify-between gap-4">
            {APPEARANCE_ITEMS.map(item => (
              <AppearanceItem
                key={item.title}
                {...item}
                icon={item.icon}
                isActive={appearance.toLowerCase() === item.title.toLowerCase()}
                onPress={() => setAppearance(item.title)}
              />
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

type AppearanceItemProps = {
  icon: 'sun' | 'moon';
  title: string;
  onPress?: () => void;
  isActive: boolean;
};

const AppearanceItem = ({
  icon,
  title,
  onPress,
  isActive,
}: AppearanceItemProps) => {
  return (
    <Pressable onPress={onPress}>
      <View
        className={
          'h-24 w-24 justify-between rounded-[16px] bg-white px-4 py-4 ' +
          (isActive ? 'border-2 border-primary' : '')
        }
      >
        <View className="">
          <AntDesign
            name={icon}
            size={24}
            color={isActive ? 'black' : '#A1A1AA'}
          />
        </View>
        <Text
          className={
            'text-sm font-[600] ' + (isActive ? 'text-black' : 'text-[#A1A1AA]')
          }
        >
          {title}
        </Text>
      </View>
    </Pressable>
  );
};

export default AppearanceModal;
