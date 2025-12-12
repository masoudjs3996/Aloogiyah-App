export const Title = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-sm  text-secondary-600">{children}</h2>
);

export const Text = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs text-secondary-700  ">{children}</p>
);

export const SmallText = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm text-secondary-500">{children}</p>
);
