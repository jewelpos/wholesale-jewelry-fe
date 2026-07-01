'use client';

import { useQuery } from '@apollo/client';
import { GET_IMPORT_HISTORY } from '@/lib/graphql/query/poImport';

interface HistoryEntry {
  importid: number;
  filename: string;
  importedby: number;
  importedat: string;
  recordcount: number;
}

interface Props {
  storeId: number;
  show: boolean;
  onClose: () => void;
}

export default function ImportHistoryDrawer({ storeId, show, onClose }: Props) {
  const { data, loading } = useQuery(GET_IMPORT_HISTORY, {
    variables: { storeid: storeId },
    skip: !show,
    fetchPolicy: 'network-only',
  });

  const history: HistoryEntry[] = data?.getImportHistory ?? [];

  return (
    <>
      {show && <div className="offcanvas-backdrop fade show" onClick={onClose} />}
      <div
        className={`offcanvas offcanvas-end${show ? ' show' : ''}`}
        style={{ width: 420, visibility: show ? 'visible' : 'hidden' }}
      >
        <div className="offcanvas-header border-bottom">
          <h6 className="offcanvas-title fw-semibold mb-0">Import History</h6>
          <button type="button" className="btn-close" onClick={onClose} />
        </div>
        <div className="offcanvas-body p-0">
          {loading && (
            <div className="p-3 text-muted text-center">
              <div className="spinner-border spinner-border-sm me-2" />
              Loading…
            </div>
          )}
          {!loading && history.length === 0 && (
            <div className="p-4 text-muted text-center">No import history found.</div>
          )}
          {!loading && history.length > 0 && (
            <table className="table table-sm table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>File</th>
                  <th className="text-center">Records</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.importid}>
                    <td className="text-break small">{h.filename}</td>
                    <td className="text-center small">{h.recordcount}</td>
                    <td className="small text-nowrap">
                      {new Date(h.importedat).toLocaleDateString()}{' '}
                      <span className="text-muted">
                        {new Date(h.importedat).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
