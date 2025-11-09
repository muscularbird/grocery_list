import Toast from 'react-native-toast-message';

const showToast = (newType: string, newText1: string, newText2: string) => {
    Toast.show({
      type: newType,
      text1: newText1,
      text2: newText2
    });
}

export default showToast;