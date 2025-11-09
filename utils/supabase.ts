import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient, processLock } from '@supabase/supabase-js'
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra;
if (!extra || !extra.EXPO_PUBLIC_SUPABASE_URL || !extra.EXPO_PUBLIC_SUPABASE_KEY) {
  throw new Error('Missing Supabase configuration in expoConfig.extra');
}
const supabaseUrl = extra.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = extra.EXPO_PUBLIC_SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey,
  {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
      detectSessionInUrl: false,
      lock: processLock,
    },
  })
        