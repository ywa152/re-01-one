// USB 设备连接模块
const modal = document.getElementById('modal');
const modalMessage = document.getElementById('modal-message');
const mainContent = document.getElementById('main-content');
const connectDevicePage = document.getElementById('connect-device-page');
const deviceConnectButton = document.getElementById('device-connect-button');
const toggleSidebarButton = document.getElementById('toggle-sidebar');
let usbDevice = null;
const VENDOR_ID = 0x045E; // 示例 vendorId（微软设备）
const PRODUCT_ID = 0x00CB; // 示例 productId

// 请求设备连接
async function connectUSB() {
    try {
        const device = await navigator.usb.requestDevice({
            filters: [{ vendorId: VENDOR_ID, productId: PRODUCT_ID }]
        });
        await device.open();
        usbDevice = device;
        // 隐藏连接设备页面，显示主页面
        connectDevicePage.style.display = 'none';
        mainContent.style.display = 'flex';
        toggleSidebarButton.style.display = 'flex';
    } catch (error) {
        // 显示连接失败弹窗，包含设备 ID 号
        modalMessage.textContent = `连接失败：设备 ID 号 ${VENDOR_ID.toString(16)}:${PRODUCT_ID.toString(16)}`;
        showModal();
        // 这里可以添加代码控制是否进入功能页面，以下注释代码用于上锁
        connectDevicePage.style.display = 'none'; 
        mainContent.style.display = 'flex';
        toggleSidebarButton.style.display = 'flex';
    }
}

// 显示模态框
function showModal() {
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.style.display = 'none';
    }, 2000);
}

// 数据传输处理
function startDataTransfer() {
    const interfaceNumber = 0;
    const endpointIn = usbDevice.configuration.interfaces[interfaceNumber].endpoints[0];

    usbDevice.transferIn(endpointIn.address, endpointIn.maxPacketSize)
      .then(result => {
            handleInTransfer(result);
        });
}

function handleInTransfer(result) {
    const data = new Uint8Array(result.data);
    // 解析鼠标数据（示例处理，需根据实际设备协议调整）
    const x = data[1];
    const y = data[2];
    const buttons = data[0];

    // 触发鼠标事件模拟
    simulateMouseMove(x, y);

    usbDevice.transferIn(result.endpoint.address, result.endpoint.maxPacketSize)
      .then(handleInTransfer);
}

// 模拟鼠标移动事件（需适配实际设备数据格式）
function simulateMouseMove(x, y) {
    const event = new MouseEvent('mousemove', {
        clientX: x,
        clientY: y,
        bubbles: true,
        cancelable: true
    });
    document.dispatchEvent(event);
}

// 原有 JavaScript 逻辑
const startRecordButton = document.getElementById('start-record');
const stopRecordButton = document.getElementById('stop-record');
const saveMacroButton = document.getElementById('save-macro');
const clearRecordButton = document.getElementById('clear-record');
const exportMacroButton = document.getElementById('export-macro');
const importMacroButton = document.getElementById('import-macro');
const macroNameInput = document.getElementById('macro-name');
const bindKeySelect = document.getElementById('bind-key');
const stepList = document.getElementById('step-list');

const keyBindingSelect = document.getElementById('key-binding');
const keySequenceInput = document.getElementById('key-sequence');
const mouseSensitivityInput = document.getElementById('mouse-sensitivity');

const sidebar = document.getElementById('sidebar');

const chart = echarts.init(document.getElementById('chart'));
const lineChartBtn = document.getElementById('line-chart-btn');
const barChartBtn = document.getElementById('bar-chart-btn');

let isRecording = false;
let macroSteps = [];
let startTime;
let currentChartType = 'line';

startRecordButton.addEventListener('click', () => {
    isRecording = true;
    startTime = Date.now();
    macroSteps = [];
    startRecordButton.disabled = true;
    stopRecordButton.disabled = false;
    saveMacroButton.disabled = true;
    stepList.innerHTML = '';
    updateCharts([]);
});

stopRecordButton.addEventListener('click', () => {
    isRecording = false;
    startRecordButton.disabled = false;
    stopRecordButton.disabled = true;
    saveMacroButton.disabled = false;
    updateCharts(macroSteps);
});

document.addEventListener('mousemove', (event) => {
    if (isRecording) {
        const elapsedTime = Date.now() - startTime;
        const step = {
            type: 'move',
            x: event.clientX,
            y: event.clientY,
            time: elapsedTime
        };
        macroSteps.push(step);
        addStepToUI(step);
        updateCharts(macroSteps);
    }
});

document.addEventListener('click', (event) => {
    if (isRecording) {
        const elapsedTime = Date.now() - startTime;
        const step = {
            type: 'click',
            x: event.clientX,
            y: event.clientY,
            time: elapsedTime
        };
        macroSteps.push(step);
        addStepToUI(step);
        updateCharts(macroSteps);
    }
});

saveMacroButton.addEventListener('click', () => {
    const macroName = macroNameInput.value;
    const bindKey = bindKeySelect.value;
    const macro = {
        name: macroName,
        bindKey: bindKey,
        steps: macroSteps
    };
    console.log('保存的宏:', macro);
    // 这里可以添加将宏保存到本地存储或发送到服务器的逻辑
});

clearRecordButton.addEventListener('click', () => {
    macroSteps = [];
    stepList.innerHTML = '';
    updateCharts([]);
});

exportMacroButton.addEventListener('click', () => {
    const macroName = macroNameInput.value;
    const bindKey = bindKeySelect.value;
    const macro = {
        name: macroName,
        bindKey: bindKey,
        steps: macroSteps
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(macro));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "mouse_macro.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
});

importMacroButton.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const macro = JSON.parse(e.target.result);
                    macroSteps = macro.steps;
                    macroNameInput.value = macro.name;
                    bindKeySelect.value = macro.bindKey;
                    stepList.innerHTML = '';
                    macroSteps.forEach(step => addStepToUI(step));
                    updateCharts(macroSteps);
                } catch (error) {
                    console.error('导入宏文件时出错:', error);
                }
            };
            reader.readAsText(file);
        }
    });
    input.click();
});

function addStepToUI(step) {
    const li = document.createElement('li');
    if (step.type === 'move') {
        li.textContent = `移动到 (${step.x}, ${step.y}) 在 ${step.time}ms`;
    } else if (step.type === 'click') {
        li.textContent = `点击 (${step.x}, ${step.y}) 在 ${step.time}ms`;
    }
    stepList.appendChild(li);
    // 滚动到最新记录
    stepList.parentElement.scrollTop = stepList.parentElement.scrollHeight;
}

function updateCharts(steps) {
    const xData = [];
    const yDataX = [];
    const yDataY = [];
    const timeData = [];

    steps.forEach((step, index) => {
        xData.push(index);
        yDataX.push(step.x);
        yDataY.push(step.y);
        timeData.push(step.time);
    });

    let option;
    if (currentChartType === 'line') {
        option = {
            title: {
                text: '鼠标坐标位置折线图'
            },
            tooltip: {
                trigger: 'axis'
            },
            xAxis: {
                type: 'category',
                name: '操作序号',
                data: xData
            },
            yAxis: {
                type: 'value',
                name: '坐标值 (px)'
            },
            series: [
                {
                    name: 'X 坐标',
                    data: yDataX,
                    type: 'line'
                },
                {
                    name: 'Y 坐标',
                    data: yDataY,
                    type: 'line'
                }
            ],
            grid: {
                left: '5%',
                right: '5%',
                bottom: '10%',
                containLabel: true
            },
            toolbox: {
                show: true,
                feature: {
                    dataZoom: {
                        yAxisIndex: 'none'
                    },
                    restore: {},
                    saveAsImage: {}
                }
            }
        };
    } else {
        option = {
            title: {
                text: '鼠标响应时间条形图'
            },
            tooltip: {
                trigger: 'axis'
            },
            xAxis: {
                type: 'category',
                name: '操作序号',
                data: xData
            },
            yAxis: {
                type: 'value',
                name: '响应时间 (ms)'
            },
            series: [
                {
                    name: '响应时间',
                    data: timeData,
                    type: 'bar'
                }
            ],
            grid: {
                left: '5%',
                right: '5%',
                bottom: '10%',
                containLabel: true
            },
            toolbox: {
                show: true,
                feature: {
                    dataZoom: {
                        yAxisIndex: 'none'
                    },
                    restore: {},
                    saveAsImage: {}
                }
            }
        };
    }

    chart.setOption(option);
}

lineChartBtn.addEventListener('click', () => {
    currentChartType = 'line';
    lineChartBtn.classList.add('active');
    barChartBtn.classList.remove('active');
    updateCharts(macroSteps);
});

barChartBtn.addEventListener('click', () => {
    currentChartType = 'bar';
    barChartBtn.classList.add('active');
    lineChartBtn.classList.remove('active');
    updateCharts(macroSteps);
});

toggleSidebarButton.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
});

// 点击设备连接按钮开始连接
deviceConnectButton.addEventListener('click', connectUSB);    