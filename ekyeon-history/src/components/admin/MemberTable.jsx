import { useCallback, useEffect, useState } from 'react';
import { collection, doc, getDocs, limit, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { MEMBER_TYPES, STATUS_LABEL } from '../../lib/constants';
import { readable } from '../../lib/errors';

// 승인 대기 · 회원 목록 공통 표
export default function MemberTable({ statusFilter }) {
  const [rows, setRows] = useState([]);
  const [state, setState] = useState('loading');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setState('loading');
    try {
      const snap = await getDocs(query(
        collection(db, 'members'),
        where('status', '==', statusFilter),
        orderBy('createdAt', 'desc'),
        limit(200)
      ));
      setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setError('');
      setState('ready');
    } catch (err) {
      setError(readable(err));
      setState('error');
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const patch = async (id, data, message) => {
    try {
      await updateDoc(doc(db, 'members', id), { ...data, updatedAt: serverTimestamp() });
      setNotice(message);
      setError('');
      await load();
    } catch (err) {
      setError(readable(err));
    }
  };

  if (state === 'loading') return <div className="state">회원 정보를 불러오는 중…</div>;
  if (state === 'error') return <div className="state">{error}</div>;

  return (
    <>
      {notice && <p className="success resource-notice">{notice}</p>}
      {error && <p className="error resource-notice">{error}</p>}
      {rows.length === 0 ? (
        <div className="state manager-state">해당하는 회원이 없습니다.</div>
      ) : (
        <div className="tablewrap">
          <table className="table">
            <thead>
              <tr>
                <th>이름</th><th>메일</th><th>소속·지역</th><th>유형</th><th>상태</th><th>처리</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.displayName}</td>
                  <td className="mono">{row.email}</td>
                  <td>{[row.school, row.region].filter(Boolean).join(' · ') || '-'}</td>
                  <td>
                    <select
                      value={row.memberType}
                      onChange={(event) => patch(row.id, { memberType: event.target.value }, '회원 유형을 변경했습니다.')}
                    >
                      {MEMBER_TYPES.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}
                    </select>
                  </td>
                  <td>{STATUS_LABEL[row.status] || row.status}</td>
                  <td>
                    <div className="rowactions">
                      {row.status !== 'approved' && (
                        <button className="btn btn--sm btn--solid" type="button" onClick={() => patch(row.id, { status: 'approved' }, '승인했습니다.')}>승인</button>
                      )}
                      {row.status !== 'rejected' && (
                        <button className="btn btn--sm btn--ghost" type="button" onClick={() => patch(row.id, { status: 'rejected' }, '승인을 거절했습니다.')}>거절</button>
                      )}
                      {row.status === 'approved' && (
                        <button className="btn btn--sm btn-ghost text-error" type="button" onClick={() => patch(row.id, { status: 'suspended' }, '이용을 정지했습니다.')}>정지</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
