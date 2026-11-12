import { BrandLogo } from "../design-system/atoms/BrandLogo";
import { BusinessScreen } from "../screens/BusinessScreen";
import React from "react";
import { useAuth } from "../shared/providers/AuthProvider";
import { View } from "react-native";
import { Text } from "../design-system/atoms/Text";
import {
  NavigationContainer,
  DefaultTheme,
  useNavigation,
  useNavigationContainerRef,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationBar } from "../design-system/molecules/BottomNavigation";
import type { Routes, MainTabRoutes } from "./types";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { theme } from "../shared/theme";
import { ChatRealtimeProvider } from "../shared/providers/ChatRealtimeProvider";
import { HomeScreen } from "../screens/HomeScreen";
import { HomeNotificationsButton } from "../design-system/molecules/HomeNotificationsButton";
import { ProductsScreen } from "../screens/ProductsScreen";
import { ProductScreen } from "../screens/ProductScreen";
import { FarmsScreen, FarmScreen } from "../screens/FarmsScreen";
import {
  LoginScreen,
  RegisterScreen,
  RecoveryScreen,
} from "../screens/AuthScreen";
import {
  CartScreen,
  CheckoutScreen,
  CheckoutDetailsScreen,
} from "../screens/CartScreen";
import { ProductInquiriesScreen } from "../screens/ProductInquiriesScreen";
import { AddressesScreen, AddressFormScreen } from "../screens/AddressesScreen";
import { OrdersScreen, OrderScreen } from "../screens/OrdersScreen";
import {
  ServicesScreen,
  ServiceFormScreen,
  ServiceScreen,
} from "../screens/ServicesScreen";
import {
  QualityScreen,
  QualityFormScreen,
  AssessmentScreen,
} from "../screens/QualityScreen";
import { ChatScreen, ChatRoomScreen } from "../screens/ChatScreen";
import { ArticlesScreen, ArticleScreen } from "../screens/ArticlesScreen";
import { AuctionsScreen, AuctionScreen } from "../screens/AuctionsScreen";
import {
  AccountScreen,
  ProfileEditScreen,
  WalletScreen,
  NotificationsScreen,
  NotificationPreferencesScreen,
  SavedScreen,
  RewardsScreen,
  SecurityScreen,
} from "../screens/AccountScreen";
import { MyFarmsScreen, FarmFormScreen } from "../screens/FarmManagementScreen";
import {
  FarmProductsScreen,
  ProductFormScreen,
} from "../screens/ProductManagementScreen";
import { CategoriesScreen, NotFoundScreen } from "../screens/CategoriesScreen";
import { AuctionFormScreen } from "../screens/AuctionFormScreen";
const Stack = createNativeStackNavigator<Routes>();
const Tabs = createBottomTabNavigator<MainTabRoutes>();
const header = {
  headerStyle: { backgroundColor: theme.white },
  headerTintColor: theme.green,
  headerTitleStyle: { fontFamily: "VazirBold" },
  headerTitleAlign: "center" as const,
};
function CatalogTab() {
  return (
    <ProductsScreen
      navigation={useNavigation<
        NativeStackNavigationProp<Routes, "Products">
      >()}
      route={{ key: "catalog", name: "Products", params: undefined }}
    />
  );
}
function CategoryTab() {
  return (
    <CategoriesScreen
      navigation={useNavigation<
        NativeStackNavigationProp<Routes, "Categories">
      >()}
      route={{ key: "category-tab", name: "Categories", params: undefined }}
    />
  );
}
function RequestsTab() {
  return (
    <ProductInquiriesScreen />
  );
}
function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={header}
      tabBar={({ state, navigation }) => (
        <NavigationBar
          tabs
          active={state.routes[state.index].name as keyof MainTabRoutes}
          onSelect={(screen) => navigation.navigate(screen)}
        />
      )}
    >
      <Tabs.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "خانه",
          headerTitle: () => null,
          headerRight: () => (
            <View
              style={{
                flexDirection: "row",
                direction: "ltr",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Text
                bold
                numberOfLines={1}
                style={{ fontSize: 20, color: theme.green }}
              >
                الوگیاه
              </Text>
              <BrandLogo compact />
            </View>
          ),
          headerLeft: () => <HomeNotificationsButton />,
          headerLeftContainerStyle: { paddingLeft: 12 },
          headerRightContainerStyle: { paddingRight: 16 },
        }}
      />
      <Tabs.Screen
        name="Catalog"
        component={CatalogTab}
        options={{ title: "آگهی‌ها" }}
      />
      <Tabs.Screen
        name="CategoryList"
        component={CategoryTab}
        options={{ title: "دسته‌بندی" }}
      />
      <Tabs.Screen
        name="Requests"
        component={RequestsTab}
        options={{ title: "درخواست‌ها" }}
      />
      <Tabs.Screen
        name="Account"
        component={AccountScreen}
        options={{ title: "داشبورد" }}
      />
    </Tabs.Navigator>
  );
}
export function Navigation() {
  const { signedIn } = useAuth();
  const ref = useNavigationContainerRef<Routes>();
  return (
    <NavigationContainer<Routes>
      key={signedIn ? "member" : "guest"}
      ref={ref}
      theme={{
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          primary: theme.green,
          background: theme.bg,
          card: theme.white,
          text: theme.ink,
          border: theme.border,
        },
      }}
      linking={{
        prefixes: ["aloogiyah://"],
        config: {
          screens: {
            Tabs: {
              screens: {
                Home: "",
                Catalog: "product",
                CategoryList: "categories",
                Requests: "dashboard/inquiries",
                Account: "dashboard",
              },
            },
            Products: "products",
            Categories: "category-tree",
            Business: "dashboard/business",
            Orders: "dashboard/orders",
            Services: "dashboard/services",
            Quality: "dashboard/quality",
            Chat: "dashboard/chat",
            Auctions: "dashboard/auctions",
            Articles: "dashboard/articles",
            Saved: "dashboard/saved",
            Addresses: "dashboard/addresses",
            MyFarms: "dashboard/farm/myFarms",
            ProfileEdit: "dashboard/profile/editProfile",
            Notifications: "notifications",
            NotificationPreferences: "dashboard/profile/notifications",
            Rewards: "dashboard/profile/rewards",
            Security: "dashboard/security",
            Login: "Login",
            Register: "Register",
            Product: "product/:code",
            Farm: "farm/:code",
            Checkout: "checkout/:code",
            CheckoutDetails: "checkout",
            Order: "order/:code",
            Article: "article/:code",
            Auction: "auction/:code",
            Wallet: "wallet-return",
            NotFound: "*",
          },
        },
      }}
    >
      <ChatRealtimeProvider
        openConversation={(code, title) => {
          if (ref.isReady()) ref.navigate("ChatRoom", { code, title });
        }}
      >
        <Stack.Navigator screenOptions={header}>
          <Stack.Screen
            name="Tabs"
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ title: "ورود" }}
          />
          <Stack.Screen
            name="Recovery"
            component={RecoveryScreen}
            options={{ title: "بازیابی رمز" }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ title: "ثبت‌نام" }}
          />
          <Stack.Screen
            name="Business"
            component={BusinessScreen}
            options={{ title: "درخواست همکاری" }}
          />
          <Stack.Screen
            name="Products"
            component={ProductsScreen}
            options={{ title: "آگهی‌ها" }}
          />
          <Stack.Screen
            name="Product"
            component={ProductScreen}
            options={{ title: "جزئیات آگهی" }}
          />
          <Stack.Screen
            name="Farms"
            component={FarmsScreen}
            options={{ title: "مزارع" }}
          />
          <Stack.Screen
            name="Farm"
            component={FarmScreen}
            options={{ title: "جزئیات مزرعه" }}
          />
          <Stack.Screen
            name="Categories"
            component={CategoriesScreen}
            options={{ title: "دسته‌بندی‌ها" }}
          />
          <Stack.Screen
            name="Cart"
            component={CartScreen}
            options={{ title: "سبد خرید" }}
          />
          <Stack.Screen
            name="CheckoutDetails"
            component={CheckoutDetailsScreen}
            options={{ title: "انتخاب آدرس و ثبت خرید" }}
          />
          <Stack.Screen
            name="Checkout"
            component={CheckoutScreen}
            options={{ title: "بررسی و پرداخت خرید" }}
          />
          <Stack.Screen
            name="Orders"
            component={OrdersScreen}
            options={{ title: "سفارش‌ها" }}
          />
          <Stack.Screen name="Inquiries" component={ProductInquiriesScreen} options={{ title: "درخواست‌های خرید" }} />
          <Stack.Screen
            name="Order"
            component={OrderScreen}
            options={{ title: "پیگیری سفارش" }}
          />
          <Stack.Screen
            name="Addresses"
            component={AddressesScreen}
            options={{ title: "آدرس‌ها" }}
          />
          <Stack.Screen
            name="AddressForm"
            component={AddressFormScreen}
            options={{ title: "ثبت و ویرایش آدرس" }}
          />
          <Stack.Screen
            name="Wallet"
            component={WalletScreen}
            options={{ title: "کیف پول" }}
          />
          <Stack.Screen
            name="ProfileEdit"
            component={ProfileEditScreen}
            options={{ title: "حساب کاربری" }}
          />
          <Stack.Screen
            name="NotificationPreferences"
            component={NotificationPreferencesScreen}
            options={{ title: "تنظیمات اعلان‌ها" }}
          />
          <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{ title: "اعلان‌ها" }}
          />
          <Stack.Screen
            name="Saved"
            component={SavedScreen}
            options={{ title: "ذخیره‌ها" }}
          />
          <Stack.Screen
            name="Services"
            component={ServicesScreen}
            options={{ title: "خدمات گیاه" }}
          />
          <Stack.Screen
            name="ServiceForm"
            component={ServiceFormScreen}
            options={{ title: "درخواست خدمت" }}
          />
          <Stack.Screen
            name="Service"
            component={ServiceScreen}
            options={{ title: "جزئیات درخواست" }}
          />
          <Stack.Screen
            name="Quality"
            component={QualityScreen}
            options={{ title: "کارشناسی کیفیت" }}
          />
          <Stack.Screen
            name="QualityForm"
            component={QualityFormScreen}
            options={{ title: "درخواست کیفیت" }}
          />
          <Stack.Screen
            name="Assessment"
            component={AssessmentScreen}
            options={{ title: "گزارش کیفیت" }}
          />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={{ title: "گفت‌وگوها" }}
          />
          <Stack.Screen
            name="ChatRoom"
            component={ChatRoomScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Auctions"
            component={AuctionsScreen}
            options={{ title: "حراجی‌ها" }}
          />
          <Stack.Screen
            name="AuctionForm"
            component={AuctionFormScreen}
            options={{ title: "ایجاد حراجی" }}
          />
          <Stack.Screen
            name="Auction"
            component={AuctionScreen}
            options={{ title: "پیشنهاد قیمت" }}
          />
          <Stack.Screen
            name="Articles"
            component={ArticlesScreen}
            options={{ title: "وبلاگ" }}
          />
          <Stack.Screen
            name="Article"
            component={ArticleScreen}
            options={{ title: "خواندن مقاله" }}
          />

          <Stack.Screen
            name="MyFarms"
            component={MyFarmsScreen}
            options={{ title: "مزارع من" }}
          />
          <Stack.Screen
            name="FarmForm"
            component={FarmFormScreen}
            options={{ title: "ثبت و ویرایش مزرعه" }}
          />
          <Stack.Screen
            name="FarmProducts"
            component={FarmProductsScreen}
            options={{ title: "آگهی‌های مزرعه" }}
          />
          <Stack.Screen
            name="ProductForm"
            component={ProductFormScreen}
            options={{ title: "مدیریت آگهی" }}
          />
          <Stack.Screen
            name="Rewards"
            component={RewardsScreen}
            options={{ title: "تخفیف‌های شما" }}
          />
          <Stack.Screen
            name="Security"
            component={SecurityScreen}
            options={{ title: "حساب کاربری" }}
          />
          <Stack.Screen
            name="NotFound"
            component={NotFoundScreen}
            options={{ title: "صفحه پیدا نشد" }}
          />
        </Stack.Navigator>
      </ChatRealtimeProvider>
    </NavigationContainer>
  );
}
