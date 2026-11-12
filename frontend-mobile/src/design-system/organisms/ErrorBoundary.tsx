import React from "react";
import { Screen } from "../templates/Screen";
import { Text } from "../atoms/Text";
import { Button } from "../atoms/Button";
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <Screen>
        <Text bold style={{ fontSize: 22, marginVertical: 40 }}>
          صفحه بارگذاری نشد
        </Text>
        <Button
          title="تلاش دوباره"
          onPress={() => this.setState({ failed: false })}
        />
      </Screen>
    ) : (
      this.props.children
    );
  }
}
