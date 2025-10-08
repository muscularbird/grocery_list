import 'dotenv/config';

export default ({ config }) => {
  return {
    ...config,
    extra: {
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_KEY: process.env.EXPO_PUBLIC_SUPABASE_KEY,
      eas: {
        projectId: "e22097d6-3467-4bcc-adfc-494b1c8d9551",
      },
    },
  };
};
