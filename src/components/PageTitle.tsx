import { useEffect } from "react";

interface Props {
  title: string;
}

/**
 * Sets document.title to "<title> | LoanWise AI" on mount.
 */
export function PageTitle({ title }: Props) {
  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} | LoanWise AI` : "LoanWise AI";
    return () => {
      document.title = prev;
    };
  }, [title]);
  return null;
}
