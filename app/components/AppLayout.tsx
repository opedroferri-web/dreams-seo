import { NavMenu } from "@shopify/app-bridge-react";
import { Frame, Page } from "@shopify/polaris";
import { NAV_ITEMS } from "~/lib/constants";

interface AppLayoutProps {
  title: string;
  children: React.ReactNode;
  primaryAction?: React.ReactNode;
  secondaryActions?: React.ReactNode;
}

export function AppLayout({
  title,
  children,
  primaryAction,
  secondaryActions,
}: AppLayoutProps) {
  return (
    <Frame>
      <NavMenu>
        {NAV_ITEMS.map((item) => (
          <a key={item.url} href={item.url} rel="home">
            {item.label}
          </a>
        ))}
      </NavMenu>
      <Page title={title} primaryAction={primaryAction} secondaryActions={secondaryActions}>
        {children}
      </Page>
    </Frame>
  );
}
