document.addEventListener('DOMContentLoaded', function () {
  const qrTrigger = document.getElementById('wechat-qr-trigger');
  const qrCode = document.getElementById('wechat-qr-code');

  if (!qrTrigger || !qrCode) return;


  // 点击微信图标弹出大尺寸二维码
  qrTrigger.querySelector('a').addEventListener('click', function (e) {
    e.preventDefault();

    // 创建弹出层（全屏半透明背景）
    const qrModal = document.createElement('div');
    qrModal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0,0,0,0.9);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      cursor: zoom-out;
      padding: 20px;
    `;

    // 弹出层标题
    const modalTitle = document.createElement('p');
    modalTitle.innerText = '微信扫码联系';
    modalTitle.style.cssText = `
      color: white;
      font-size: 18px;
      margin-bottom: 20px;
      font-weight: 500;
    `;

    // 弹出的大尺寸二维码
    const qrModalImg = document.createElement('img');
    qrModalImg.src = qrCode.src;
    qrModalImg.alt = qrCode.alt;
    qrModalImg.style.cssText = `
      width: 280px;
      height: 280px;
      border: 8px solid white;
      border-radius: 12px;
      cursor: default;
      margin-bottom: 20px;
    `;

    // 关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.innerText = '关闭';
    closeBtn.style.cssText = `
      padding: 10px 24px;
      background: #165DFF;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 16px;
      cursor: pointer;
      transition: background 0.2s;
    `;
    closeBtn.addEventListener('mouseover', () => closeBtn.style.background = '#0E4BDB');
    closeBtn.addEventListener('mouseout', () => closeBtn.style.background = '#165DFF');

    // 组装弹出层
    qrModal.appendChild(modalTitle);
    qrModal.appendChild(qrModalImg);
    qrModal.appendChild(closeBtn);
    document.body.appendChild(qrModal);

    // 关闭弹出层逻辑
    const closeModal = () => {
      document.body.removeChild(qrModal);
      document.body.style.overflow = 'auto'; // 恢复页面滚动
    };
    // 点击背景/按钮关闭，点击二维码不关闭
    qrModal.addEventListener('click', closeModal);
    closeBtn.addEventListener('click', closeModal);
    qrModalImg.addEventListener('click', (e) => e.stopPropagation());
    // 按ESC键关闭
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });

    // 禁止页面滚动（避免弹出层后背景滚动）
    document.body.style.overflow = 'hidden';
  });

  // 可选：处理极端情况（二维码超出视口顶部）
  qrTrigger.addEventListener('mouseenter', function () {
    setTimeout(() => {
      const qrRect = qrCode.getBoundingClientRect();
      if (qrRect.top < 0) {
        // 若二维码顶部超出视口，强制向下显示
        qrCode.style.bottom = 'auto';
        qrCode.style.top = 'calc(100% + 10px)';
      } else {
        // 正常情况下向上显示
        qrCode.style.bottom = 'calc(100% + 10px)';
        qrCode.style.top = 'auto';
      }
    }, 10);
  });
});