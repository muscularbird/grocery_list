import { Text, View, TouchableOpacity } from 'react-native'
import { useState } from 'react'
import LoginScreen from './sign-in'
import RegisterScreen from './register'

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true)

  return (
    <View className="flex-1 items-center justify-center bg-background px-6 py-8">
      <View className="w-full max-w-md rounded-2xl border border-border bg-card p-6">
        <Text className="mb-2 text-center text-2xl font-bold text-cardForeground">
          {isLogin ? 'Welcome back' : 'Create an account'}
        </Text>
        <Text className="mb-6 text-center text-sm text-foregroundMuted">
          {isLogin ? 'Sign in to continue to your grocery list.' : 'Start organizing your groceries today.'}
        </Text>
        {isLogin ? <LoginScreen /> : <RegisterScreen />}
      </View>
      <View className="mt-6 flex-row items-center justify-center">
        <Text className="text-sm text-foregroundMuted">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}
        </Text>
        <TouchableOpacity className="ml-2" onPress={() => setIsLogin(!isLogin)}>
          <Text className="text-sm font-bold text-primary">{isLogin ? 'Register' : 'Sign in'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}