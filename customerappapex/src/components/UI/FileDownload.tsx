import { FiDownload } from 'react-icons/fi';

interface FileDownloadProps {
  href: string;
  filename: string;
  children?: React.ReactNode;
}

export function FileDownload({ href, filename, children }: FileDownloadProps) {
  return (
    <a
      href={href}
      download={filename}
      target="_blank"
      rel="noopener noreferrer"
      className="button button--secondary"
    >
      <FiDownload />
      {children || 'Download'}
    </a>
  );
}