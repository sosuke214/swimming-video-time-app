// 「動画を生成する」ボタンの処理
document.getElementById('generateBtn').addEventListener('click', async () => {
    // 大会名などの取得を削除し、ファイルだけを取得
    const videoFile = document.getElementById('videoFile').files[0];
    const imageFile = document.getElementById('imageFile').files[0];

    if (!videoFile || !imageFile) {
        alert("レース動画とラップ表の画像の両方を選択してくれ！");
        return;
    }

    const btn = document.getElementById('generateBtn');
    btn.innerText = "処理準備中...";
    btn.disabled = true;

    try {
        const video = document.createElement('video');
        video.playsInline = true;
        video.src = URL.createObjectURL(videoFile);
        
        const img = new Image();
        img.src = URL.createObjectURL(imageFile);

        await Promise.all([
            new Promise((resolve, reject) => {
                video.onloadedmetadata = resolve;
                video.onerror = () => reject(new Error("動画の読み込みに失敗した。"));
                video.load();
            }),
            new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = () => reject(new Error("画像の読み込みに失敗した。"));
            })
        ]);

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContext();
        const audioSource = audioCtx.createMediaElementSource(video);
        const audioDest = audioCtx.createMediaStreamDestination();
        audioSource.connect(audioDest);

        const canvasStream = canvas.captureStream(30);
        const combinedStream = new MediaStream([
            ...canvasStream.getVideoTracks(),
            ...audioDest.stream.getAudioTracks()
        ]);

        let mimeType = 'video/webm'; 
        let extension = 'webm';
        if (MediaRecorder.isTypeSupported('video/mp4')) {
            mimeType = 'video/mp4'; 
            extension = 'mp4';
        }
        
        const recorder = new MediaRecorder(combinedStream, { mimeType: mimeType });
        const chunks = [];

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
            console.log("録画完了！ファイルの生成中...");
            const blob = new Blob(chunks, { type: mimeType });
            const videoURL = URL.createObjectURL(blob);
            
            // 【変更点】ファイル名を「レース動画_月日時分.mp4」にする
            const now = new Date();
            const timeStr = `${now.getMonth() + 1}月${now.getDate()}日_${now.getHours()}時${now.getMinutes()}分`;
            
            const a = document.createElement('a');
            a.href = videoURL;
            a.download = `レース動画_${timeStr}.${extension}`;
            a.click();

            btn.innerText = "動画を生成する";
            btn.disabled = false;
        };

        btn.innerText = "等倍速で録画中...（動画が終わるまで待機）";
        await audioCtx.resume();
        recorder.start();
        await video.play();

        const drawFrame = () => {
            if (video.paused || video.ended) return;

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            if (video.currentTime <= 3.0) {
                const areaW = canvas.width / 3;
                const areaH = canvas.height / 3;

                const scale = Math.min(areaW / img.width, areaH / img.height);
                const drawW = img.width * scale;
                const drawH = img.height * scale;

                const drawX = canvas.width - drawW;
                const drawY = 0;
                
                ctx.drawImage(img, drawX, drawY, drawW, drawH);
            }

            requestAnimationFrame(drawFrame);
        };

        drawFrame();

        video.onended = () => {
            recorder.stop();
        };

    } catch (error) {
        console.error("処理中にエラーが発生した:", error);
        alert(error.message || "エラーが発生した。コンソールを確認してくれ。");
        btn.innerText = "動画を生成する";
        btn.disabled = false;
    }
});