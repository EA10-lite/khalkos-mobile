import { ActivityIndicator, Text, TouchableOpacity } from 'react-native';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

const Button = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
}: ButtonProps) => {
  const isDisabled = disabled || loading;

  const getButtonStyles = () => {
    if (variant === 'secondary') {
      return `w-full bg-gray-100 py-4 px-6 rounded-[12px] my-4 ${isDisabled ? 'opacity-50' : ''}`;
    }
    return `w-full bg-primary py-4 px-6 rounded-[12px] my-4 ${isDisabled ? 'opacity-50' : ''}`;
  };

  const getTextStyles = () => {
    if (variant === 'secondary') {
      return 'text-black text-center text-lg font-semibold';
    }
    return 'text-white text-center text-lg font-semibold';
  };

  return (
    <TouchableOpacity
      className={getButtonStyles()}
      onPress={onPress}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'secondary' ? '#000' : '#fff'}
          size="small"
        />
      ) : (
        <Text className={getTextStyles()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

export default Button;
