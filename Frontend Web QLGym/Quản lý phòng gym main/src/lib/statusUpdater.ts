export const updateRelatedStatuses = async (maHd: string, ngayThanhToan?: string) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // 1. Fetch all invoices
    const invoicesRes = await fetch('http://localhost:5079/api/hoadons');
    const invoices = invoicesRes.ok ? await invoicesRes.json() : [];

    // 2. Fetch the contract
    const contractRes = await fetch(`http://localhost:5079/api/hopdongs/${maHd}`);
    if (!contractRes.ok) return;
    const contract = await contractRes.json();
    
    // Fetch packages to calculate new end date
    const packagesRes = await fetch('http://localhost:5079/api/goitaps');
    const packages = packagesRes.ok ? await packagesRes.json() : [];
    
    // 3. Calculate contract status and dates
    const contractInvoices = invoices.filter((i: any) => i.maHd === maHd || i.MaHD === maHd || i.MaHd === maHd);
    let newContractStatus = 'Locked';
    let updatedContract = { ...contract };
    let contractNeedsUpdate = false;

    if (contractInvoices.length > 0) {
      // Update start date to the latest invoice payment date if provided or found
      let paymentDate = ngayThanhToan;
      if (!paymentDate) {
        // Sort invoices by date descending to get the latest
        contractInvoices.sort((a: any, b: any) => {
          const dateA = new Date(a.ngayThanhToan || a.NgayThanhToan || 0).getTime();
          const dateB = new Date(b.ngayThanhToan || b.NgayThanhToan || 0).getTime();
          return dateB - dateA;
        });
        const latestInvoice = contractInvoices[0];
        paymentDate = latestInvoice.ngayThanhToan || latestInvoice.NgayThanhToan;
      }

      if (paymentDate) {
        const pkg = packages.find((p: any) => (p.maGoiTap || p.MaGoiTap) === (contract.maGoiTap || contract.MaGoiTap));
        const duration = pkg ? (pkg.thoihan || pkg.Thoihan || 0) : 0;
        const soLuong = contract.soLuong || contract.SoLuong || 1;
        
        const startDate = new Date(paymentDate);
        startDate.setDate(startDate.getDate() + (duration * soLuong));
        const newNgayKt = startDate.toISOString().split('T')[0];

        updatedContract.NgayBD = paymentDate;
        updatedContract.NgayKT = newNgayKt;
        contractNeedsUpdate = true;
      }

      const ngayKt = updatedContract.NgayKT || updatedContract.ngayKt || contract.NgayKt || contract.NgayKT;
      if (ngayKt && ngayKt.split('T')[0] < today) {
        newContractStatus = 'Expired';
      } else {
        newContractStatus = 'Active';
      }
    }

    // 4. Update contract if needed
    const currentContractStatus = contract.trangThaiHd || contract.TrangThaiHd || contract.TrangThaiHD;
    if (currentContractStatus !== newContractStatus) {
      updatedContract.TrangThaiHD = newContractStatus;
      contractNeedsUpdate = true;
    }

    if (contractNeedsUpdate) {
      await fetch(`http://localhost:5079/api/hopdongs/${maHd}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedContract)
      });
    }

    // 5. Fetch member
    const maHv = contract.maHv || contract.MaHv || contract.MaHV;
    if (!maHv) return;

    const memberRes = await fetch(`http://localhost:5079/api/members/${maHv}`);
    if (!memberRes.ok) return;
    const member = await memberRes.json();

    // 6. Fetch all contracts for this member
    const allContractsRes = await fetch('http://localhost:5079/api/hopdongs');
    const allContracts = allContractsRes.ok ? await allContractsRes.json() : [];
    const memberContracts = allContracts.filter((c: any) => (c.maHv || c.MaHv || c.MaHV) === maHv);

    // 7. Calculate member status
    let newMemberStatus = 'Locked';
    let hasAnyInvoice = false;
    let hasActive = false;
    let allExpired = true;
    let allContractsLocked = memberContracts.length > 0;

    for (const c of memberContracts) {
      const cMaHd = c.maHd || c.MaHd || c.MaHD;
      const cStatus = c.trangThaiHd || c.TrangThaiHd || c.TrangThaiHD;
      
      if (cStatus !== 'Locked') {
        allContractsLocked = false;
      }

      const isCurrentContract = cMaHd === maHd;
      const hasInv = invoices.some((i: any) => i.maHd === cMaHd || i.MaHD === cMaHd || i.MaHd === cMaHd);
      if (hasInv) {
        hasAnyInvoice = true;
        const cNgayKt = isCurrentContract ? (updatedContract.NgayKT || updatedContract.ngayKt || c.ngayKt || c.NgayKt || c.NgayKT) : (c.ngayKt || c.NgayKt || c.NgayKT);
        if (cNgayKt && cNgayKt.split('T')[0] >= today) {
          hasActive = true;
          allExpired = false;
        }
      }
    }

    const memberLyDoKhoa = member.lyDoKhoa || member.LyDoKhoa || '';

    if (memberLyDoKhoa || allContractsLocked) {
      newMemberStatus = 'Locked';
    } else if (hasAnyInvoice) {
      if (hasActive) {
        newMemberStatus = 'Active';
      } else if (allExpired) {
        newMemberStatus = 'Expired';
      }
    }

    // 8. Update member if needed
    const currentMemberStatus = member.trangthai || member.Trangthai || member.TrangThai;
    if (currentMemberStatus !== newMemberStatus) {
      await fetch(`http://localhost:5079/api/members/${maHv}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...member, trangthai: newMemberStatus })
      });
    }

  } catch (error) {
    console.error("Error updating related statuses:", error);
  }
};
