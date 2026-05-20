import { format, formatDistanceToNow } from 'date-fns';

export const formatDate = (iso: string): string => {
  try {
    return format(new Date(iso), 'dd MMM yyyy');
  } catch {
    return iso;
  }
};

export const formatTime = (iso: string): string => {
  try {
    return format(new Date(iso), 'hh:mm a');
  } catch {
    return iso;
  }
};

export const formatDateTime = (iso: string): string => {
  try {
    return format(new Date(iso), 'dd MMM yyyy, hh:mm a');
  } catch {
    return iso;
  }
};

export const timeAgo = (iso: string): string => {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return iso;
  }
};

export const formatDeliveryRange = (iso: string): string => {
  try {
    const date = new Date(iso);
    const start = format(date, 'dd MMM');
    const end = new Date(date);
    end.setDate(end.getDate() + 2);
    return `${start} – ${format(end, 'dd MMM yyyy')}`;
  } catch {
    return iso;
  }
};

export const formatRelativeDate = formatDateTime;
