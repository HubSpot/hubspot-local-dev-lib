export type FireAlarm = {
  id: number;
  title: string;
  message: string;
  urlRegexPattern: string | null;
  querySelector: string | null;
  severity: string;
  createdAt: number;
};
