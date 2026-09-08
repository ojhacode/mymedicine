import { useLanguage } from "@context/LanguageContext"
import { createDrawerNavigator } from "@react-navigation/drawer"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { View } from "react-native"
import MainBottomTab from "@appStack/MainBottomTab"
import LangSlctnTab from "@appStack/LangSlctnTab"
import LeftDrawerTab from "@appStack/LeftDrawerTab"
import LogIn from "@authStack/Login"
import { FamilyTab } from "@appStack/FamilyTab"
import SettingTab from "@appStack/SettingTab"
import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons"

// navigation/AuthStack.tsx
const Stack = createNativeStackNavigator()
const Drawer = createDrawerNavigator()

export const AuthStack = () =>
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="LogIn" component={LogIn} />
  </Stack.Navigator>

// navigation/AppStack.tsx
export const AppStack = () => {
  const { t } = useLanguage()

  return <>
    <Drawer.Navigator
      drawerContent={props => <LeftDrawerTab {...props} />}
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { elevation: 0, shadowOpacity: 0, borderBottomWidth: 0 },
        drawerType: "front",
        drawerItemStyle: { borderRadius: 14, marginHorizontal: 8, paddingVertical: 1 },
        drawerLabelStyle: { fontSize: 14.5, fontWeight: "600", marginLeft: -5 },
        drawerStyle: {backgroundColor:'red', borderTopRightRadius: 30, borderBottomRightRadius: 32 },
      }}
    >
      <Drawer.Screen
        name="Home" component={MainBottomTab}
        options={{
          headerShown: false, drawerLabel: t('section.home'), drawerLabelStyle:{color:'grey'},
          drawerIcon: ({ color }) => (
            <View className="w-7 h-7 rounded-[8px] items-center justify-center" style={{ backgroundColor: "#e4f2ff" }}>
              <MaterialDesignIcons name="home" size={18} color="#2f7dd6" />
            </View>
          ),
        }}
      />
      <Drawer.Screen
        name="Family" component={FamilyTab}
        options={{
          headerShown: false, drawerLabel: t('section.family'), drawerLabelStyle:{color:'grey'},
          drawerIcon: () => (
            <View className="w-7 h-7 rounded-[10px] items-center justify-center" style={{ backgroundColor: "#fdeaf3" }}>
              <MaterialDesignIcons name="home-roof" size={20} color="#e07bb0" />
            </View>
          ),
        }}
      />
      <Drawer.Screen
        name="LanguageSelection" component={LangSlctnTab}
        options={{
          headerShown: false, drawerLabel: t('section.language'), drawerLabelStyle:{color:'grey'},
          drawerIcon: () => (
            <View className="w-7 h-7 rounded-[10px] items-center justify-center" style={{ backgroundColor: "#fff1e2" }}>
              <MaterialDesignIcons name="flag" size={18} color="#f0a35c" />
            </View>
          )
        }}
      />
      <Drawer.Screen
        name="setting" component={SettingTab}
        options={{
          headerShown: false, drawerLabel: t('section.setting'), drawerLabelStyle:{color:'grey'},
          drawerIcon: () => (
            <View className="w-7 h-7 rounded-[10px] items-center justify-center" style={{ backgroundColor: "#ddd8d8" }}>
              <MaterialDesignIcons name="cog-play-outline" size={14} color="#776e6e" />
            </View>
          )
        }}
      />  
    </Drawer.Navigator>
  </>
}