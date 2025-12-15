// Single clean script for file upload and webcam capture
document.addEventListener('change', (e) => {
	if (e.target.matches('.filepicker input[type="file"]')) {
		const label = e.target.closest('.filepicker').querySelector('span');
		label.textContent = e.target.files?.[0]?.name || 'Select an image';
	}
});

(function () {
	// Support both old and new element IDs
	const startBtn = document.getElementById('startCam') || document.getElementById('startCamera');
	const startLiveBtn = document.getElementById('startLive') || document.getElementById('startDetection');
	const captureBtn = document.getElementById('capture') || document.getElementById('captureBtn');
	const uploadBtn = document.getElementById('uploadCapture') || document.getElementById('analyzeBtn');
	const videoEl = document.getElementById('webcam');
	const canvasEl = document.getElementById('snapshot');
	const liveDescEl = document.getElementById('liveDescription');
	const detectionBoxesEl = document.getElementById('detectionBoxes');
	const fileInput = document.getElementById('fileInput');
	const uploadForm = document.getElementById('uploadForm');

	if (!videoEl) return;

	// wire stop camera button (if present)
	const stopCamBtn = document.getElementById('stopCam') || document.getElementById('stopCamera');
	if (stopCamBtn) {
		stopCamBtn.addEventListener('click', () => {
			if (mediaStream) {
				const tracks = mediaStream.getTracks();
				tracks.forEach(t => t.stop());
				mediaStream = null;
				try { videoEl.srcObject = null; } catch (e) { videoEl.src = ''; }
				if (captureBtn) captureBtn.disabled = true;
				if (startLiveBtn) startLiveBtn.disabled = true;
				if (uploadBtn) uploadBtn.disabled = true;
				showLoading(false);
				// Reset button states
				if (startBtn) {
					startBtn.disabled = false;
					startBtn.innerHTML = '<span class="btn-icon">📹</span>Start Camera';
				}
				// Hide video and show placeholder
				videoEl.style.display = 'none';
				const placeholder = document.getElementById('cameraPlaceholder');
				if (placeholder) placeholder.style.display = 'block';
			}
		});
	}

	let mediaStream = null;
	let lastBlob = null;
	let liveDetectionActive = false;
	let liveDetectionInterval = null;
	let lastSpokenText = '';

	if (uploadForm && fileInput) {
		
		// Validate client-side but allow normal form submission so browser navigates to result page
		uploadForm.addEventListener('submit', function (e) {
			const file = fileInput.files[0];
			if (!file) { e.preventDefault(); alert('Please select a file'); return; }
			if (!file.type.startsWith('image/')) { e.preventDefault(); alert('Select an image file'); return; }
			// Show loading indicator while the browser navigates to the result page
			showLoading(true);
			// Do not call e.preventDefault() — let the form submit normally to /predict
		});
	}

	if (startBtn) {
		startBtn.addEventListener('click', async () => {
			console.debug('[script.js] startCam clicked');
			if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
				console.error('[script.js] getUserMedia not available');
				alert('Camera API not supported in this browser. Use a modern browser (Chrome/Edge/Firefox) or open via localhost/https.');
				return;
			}

			if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
				alert('Camera requires a secure context. Open via https or localhost.');
			}

			try {
				if (navigator.permissions?.query) {
					try { const perm = await navigator.permissions.query({ name: 'camera' }); if (perm.state === 'denied') { console.warn('[script.js] camera permission denied'); alert('Camera permission is blocked.'); return; } } catch (permErr) { console.debug('[script.js] permissions.query not available or threw', permErr); }
				}

				const tryConstraints = async (c) => navigator.mediaDevices.getUserMedia(c);
				let stream = null;
				try {
					stream = await tryConstraints({ video: { facingMode: 'environment' }, audio: false });
				} catch (e1) {
					console.debug('[script.js] environment facingMode failed, trying default', e1);
					try {
						stream = await tryConstraints({ video: true, audio: false });
					} catch (e2) {
						console.error('[script.js] getUserMedia fallback failed', e2);
					}
				}

				if (!stream) throw new Error('Permission denied or no camera available');

				console.debug('[script.js] obtained media stream', stream);
				mediaStream = stream;
				try {
					videoEl.srcObject = mediaStream;
				} catch (assignErr) {
					console.error('[script.js] error assigning srcObject', assignErr);
					videoEl.src = window.URL.createObjectURL(mediaStream);
				}
				
				// Show video and hide placeholder
				videoEl.style.display = 'block';
				const placeholder = document.getElementById('cameraPlaceholder');
				if (placeholder) placeholder.style.display = 'none';
				
				// Update button states
				startBtn.disabled = true;
				if (captureBtn) {
					captureBtn.disabled = true;
					captureBtn.textContent = 'No Fruit Detected';
				}
				if (startLiveBtn) startLiveBtn.disabled = false;
				if (uploadBtn) {
					uploadBtn.disabled = false;
					uploadBtn.textContent = 'Analyze Current Frame';
				}
				if (canvasEl) canvasEl.classList.add('hidden');
				videoEl.classList.remove('hidden');
				if (liveDescEl) liveDescEl.classList.add('hidden');
			} catch (err) {
				console.error('[script.js] getUserMedia error', err);
				const msg = (err && err.name === 'NotAllowedError') ? 'Permission denied. Use http://localhost (or https) and allow camera access.' : (err?.message || String(err));
				alert('Unable to access camera: ' + msg);
			}
		});
	}

	if (captureBtn) {
		captureBtn.addEventListener('click', () => {
			if (captureBtn.disabled) return;
			if (!videoEl.videoWidth || !videoEl.videoHeight) return;
			if (canvasEl) {
				const w = videoEl.videoWidth, h = videoEl.videoHeight; 
				canvasEl.width = w; 
				canvasEl.height = h; 
				const ctx = canvasEl.getContext('2d'); 
				ctx.drawImage(videoEl, 0, 0, w, h); 
				videoEl.classList.add('hidden'); 
				canvasEl.classList.remove('hidden');
				canvasEl.toBlob(b => { 
					lastBlob = b; 
					if (uploadBtn) {
						uploadBtn.disabled = !b; 
						uploadBtn.textContent = 'Analyze Capture';
					}
				}, 'image/jpeg', 0.92);
			}
			stopLiveDetection();
		});
	}

	if (startLiveBtn) {
		startLiveBtn.addEventListener('click', () => {
			if (!liveDetectionActive) {
				startLiveDetection();
			} else {
				stopLiveDetection();
			}
		});
	}

	function startLiveDetection() {
		if (!videoEl.videoWidth || !videoEl.videoHeight) {
			console.log('Video not ready, waiting...');
			setTimeout(startLiveDetection, 500);
			return;
		}
		console.log('Starting live detection...');
		
		liveDetectionActive = true;
		if (startLiveBtn) {
			startLiveBtn.innerHTML = '<span class="btn-icon">⏹️</span>Stop Detection';
			startLiveBtn.classList.add('stop');
		}
		if (liveDescEl) liveDescEl.classList.remove('hidden');

		if (captureBtn) {
			captureBtn.disabled = true;
			captureBtn.textContent = 'No Fruit Detected';
		}
		
		liveDetectionInterval = setInterval(() => {
			if (!liveDetectionActive) return;
			
			const canvas = document.createElement('canvas');
			canvas.width = videoEl.videoWidth;
			canvas.height = videoEl.videoHeight;
			const ctx = canvas.getContext('2d');
			ctx.drawImage(videoEl, 0, 0);
			
			canvas.toBlob(blob => {
				if (!blob || !liveDetectionActive) return;
				
				const formData = new FormData();
				formData.append('file', blob, 'live_frame.jpg');
				
				fetch('/live_detect', {
					method: 'POST',
					body: formData
				})
				.then(response => response.json())
				.then(data => {
					if (liveDetectionActive && data.success) {
						if (liveDescEl && liveDescEl.querySelector('p')) {
							liveDescEl.querySelector('p').textContent = data.description;
						}
						if (data.objects && data.objects.length > 0 && data.should_speak) {
							speakText(data.description);
						}
						drawDetectionBoxes(data.objects || []);
						// Enable capture only if fruit/vegetable detected
						if (data.has_fruit && captureBtn) {
							captureBtn.disabled = false;
							captureBtn.innerHTML = '<span class="btn-icon">📸</span>Capture Fruit';
							captureBtn.classList.remove('secondary');
						} else if (captureBtn) {
							captureBtn.disabled = true;
							captureBtn.innerHTML = '<span class="btn-icon">📸</span>No Fruit Detected';
							captureBtn.classList.add('secondary');
						}
					}
				})
				.catch(err => {
					console.log('Live detection error:', err);
					// Continue detection even on error
					if (liveDetectionActive && liveDescEl && liveDescEl.querySelector('p')) {
						liveDescEl.querySelector('p').textContent = 'Detection error, retrying...';
					}
				});
			}, 'image/jpeg', 0.92);
		}, 800);
	}

	function stopLiveDetection() {
		liveDetectionActive = false;
		if (liveDetectionInterval) {
			clearInterval(liveDetectionInterval);
			liveDetectionInterval = null;
		}
		if (startLiveBtn) {
			startLiveBtn.innerHTML = '<span class="btn-icon">🔴</span>Start Detection';
			startLiveBtn.classList.remove('stop');
		}
		if (liveDescEl) liveDescEl.classList.add('hidden');
		if (detectionBoxesEl) detectionBoxesEl.innerHTML = '';
		if (captureBtn) {
			captureBtn.disabled = true;
			captureBtn.innerHTML = '<span class="btn-icon">📸</span>Capture';
		}
		lastSpokenText = '';
	}

	function drawDetectionBoxes(objects) {
		if (!detectionBoxesEl) return;
		detectionBoxesEl.innerHTML = '';
		
		if (!objects || objects.length === 0) return;
		
		const videoRect = videoEl.getBoundingClientRect();
		const containerRect = videoEl.parentElement.getBoundingClientRect();
		
		const scaleX = videoRect.width / videoEl.videoWidth;
		const scaleY = videoRect.height / videoEl.videoHeight;
		
		objects.forEach(obj => {
			if (obj.bbox && obj.confidence > 0.3) {
				const [x1, y1, x2, y2] = obj.bbox;
				
				const left = (x1 * scaleX) + (videoRect.left - containerRect.left);
				const top = (y1 * scaleY) + (videoRect.top - containerRect.top);
				const width = (x2 - x1) * scaleX;
				const height = (y2 - y1) * scaleY;
				
				const box = document.createElement('div');
				box.className = 'detection-box';
				box.style.left = left + 'px';
				box.style.top = top + 'px';
				box.style.width = width + 'px';
				box.style.height = height + 'px';
				
				const label = document.createElement('div');
				label.textContent = obj.object;
				label.style.cssText = 'position:absolute;top:-25px;left:0;background:#00ff00;color:black;padding:2px 6px;font-size:12px;border-radius:3px;';
				box.appendChild(label);
				
				detectionBoxesEl.appendChild(box);
			}
		});
	}

	if (uploadBtn) {
		uploadBtn.addEventListener('click', async () => {
			// Check if we have a captured image or need to capture current frame
			let blobToAnalyze = lastBlob;
			
			// If no captured image but camera is active, capture current frame
			if (!blobToAnalyze && videoEl && videoEl.videoWidth && videoEl.videoHeight && mediaStream) {
				const canvas = document.createElement('canvas');
				// Use higher resolution for better accuracy
				canvas.width = Math.min(videoEl.videoWidth, 1024);
				canvas.height = Math.min(videoEl.videoHeight, 1024);
				const ctx = canvas.getContext('2d');
				// Use better image rendering
				ctx.imageSmoothingEnabled = true;
				ctx.imageSmoothingQuality = 'high';
				ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
				
				// Convert to blob with higher quality
				await new Promise(resolve => {
					canvas.toBlob(blob => {
						blobToAnalyze = blob;
						resolve();
					}, 'image/jpeg', 0.95);
				});
			}
			
			if (!blobToAnalyze) {
				alert('No image to analyze. Please capture an image first.');
				return;
			}
			
			showLoading(true); 
			uploadBtn.disabled = true; 
			uploadBtn.textContent = 'Analyzing...';
				try {
					// Create FormData and submit to /predict (same as upload)
					const formData = new FormData();
					formData.append('file', blobToAnalyze, `capture_${Date.now()}.jpg`);
					
					// Submit to same route as upload for consistent results
					const tempForm = document.createElement('form');
					tempForm.method = 'POST';
					tempForm.action = '/predict';
					tempForm.enctype = 'multipart/form-data';

					const fileInputEl = document.createElement('input');
					fileInputEl.type = 'file';
					fileInputEl.name = 'file';
					const dt = new DataTransfer();
					dt.items.add(new File([blobToAnalyze], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' }));
					fileInputEl.files = dt.files;

					tempForm.appendChild(fileInputEl);
					document.body.appendChild(tempForm);
					showLoading(true);
					tempForm.submit();
					return;
				} catch (err) { 
					showLoading(false); 
					alert('Upload error: ' + (err?.message || err)); 
					uploadBtn.disabled = false; 
					uploadBtn.textContent = 'Analyze Capture'; 
				}
		});
	}

	function showLoading(show) { 
		const els = document.querySelectorAll('.loading'); 
		els.forEach(el => el.style.display = show ? 'block' : 'none'); 
		if (captureBtn && !show) captureBtn.disabled = show; 
		if (uploadBtn && !show) {
			uploadBtn.disabled = false;
			uploadBtn.textContent = lastBlob ? 'Analyze Capture' : 'Analyze Current Frame';
		}
		if (startBtn && !show) startBtn.disabled = show; 
	}

	function showDetailedResult(data) { const resultSection = document.querySelector('.result-section'); const resultContent = document.querySelector('.result-content'); const speakButton = document.getElementById('speakButton'); if (resultSection && resultContent) { const statusClass = data.is_infected ? 'infected' : 'healthy'; const statusText = data.is_infected ? 'INFECTED' : 'HEALTHY'; resultContent.innerHTML = `<div class="result-banner ${statusClass}"><div class="pill ${statusClass}">${statusText}</div><h3>Fruit Type: ${data.fruit}</h3><p>Condition: ${data.condition}</p><p>Confidence: <strong>${data.confidence_percentage}</strong></p></div>`; resultSection.style.display = 'block'; if (speakButton) speakButton.style.display = 'inline-block'; resultSection.scrollIntoView({ behavior: 'smooth' }); } }

	// New helper to show non-fruit results returned by the server when using AJAX
	function showNonFruitResult(confidence) {
		const resultSection = document.querySelector('.result-section');
		const resultContent = document.querySelector('.result-content');
		const speakButton = document.getElementById('speakButton');
		if (resultSection && resultContent) {
			resultContent.innerHTML = `<div class="result-banner infected"><div class="pill infected">INVALID INPUT</div><h3>Result: Invalid Input</h3><p>This image does not appear to be a fruit or vegetable.</p><p>Confidence: <strong>${(confidence*100).toFixed(2)}%</strong></p></div>`;
			resultSection.style.display = 'block';
			if (speakButton) {
				speakButton.style.display = 'inline-block';
				speakButton.onclick = function () { speakText('This image does not appear to be a fruit or vegetable.'); };
			}
			resultSection.scrollIntoView({ behavior: 'smooth' });
		}
	}

	function showResult(message, type) { const resultSection = document.querySelector('.result-section'); const resultContent = document.querySelector('.result-content'); const speakButton = document.getElementById('speakButton'); if (resultSection && resultContent) { resultContent.innerHTML = `<div class="result-content ${type}"><h3>Analysis Complete</h3><p>${message}</p></div>`; resultSection.style.display = 'block'; if (speakButton) speakButton.style.display = 'none'; resultSection.scrollIntoView({ behavior: 'smooth' }); } }

	const speakButton = document.getElementById('speakButton'); if (speakButton) { speakButton.addEventListener('click', function () { const resultContent = document.querySelector('.result-content'); if (resultContent) { const fruit = resultContent.querySelector('h3').textContent.replace('Fruit Type: ', ''); const condition = resultContent.querySelector('p:nth-child(3)').textContent.replace('Condition: ', ''); const confidence = resultContent.querySelector('p:nth-child(4)').textContent.replace('Confidence: ', ''); const text = `This is a ${fruit}, and it is ${condition}. Confidence level is ${confidence}.`; speakText(text); } }); }

	function speakText(text) { if ('speechSynthesis' in window) { const utt = new SpeechSynthesisUtterance(text); utt.lang = 'en-US'; utt.rate = 1.0; utt.pitch = 1.0; speechSynthesis.speak(utt); } else { alert('Text-to-speech is not supported in your browser.'); } }

	function speakResults(data) { const text = `This is a ${data.fruit}, and it is ${data.condition}. Confidence level is ${data.confidence_percentage}.`; speakText(text); }

	window.addEventListener('beforeunload', function () {
		stopLiveDetection();
		if (mediaStream) { const tracks = mediaStream.getTracks(); tracks.forEach(t => t.stop()); }
	});
})();

// Charts: fetch /stats and render Chart.js charts
document.addEventListener('DOMContentLoaded', function () {
	// Dropzone & Analyze page handlers
	try {
		const dropzone = document.getElementById('dropzone');
		const dzFileInput = document.getElementById('fileInput');
		const analyzeBtn = document.getElementById('analyzeBtn');
		const resetBtn = document.getElementById('resetBtn');
		const dzForm = document.getElementById('uploadForm');

		if (dropzone && dzFileInput) {
			['dragenter','dragover'].forEach(ev => dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.add('dragover'); }));
			['dragleave','drop'].forEach(ev => dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.remove('dragover'); }));

			dropzone.addEventListener('drop', function (e) {
				const files = (e.dataTransfer && e.dataTransfer.files) || [];
				if (files.length) {
					dzFileInput.files = files;
				}
			});

			// When user clicks the dropzone, the hidden file input will open (browser default)
			dropzone.addEventListener('click', () => dzFileInput.click());
		}

		if (dzForm && dzFileInput) {
			dzForm.addEventListener('submit', function (e) {
				const f = dzFileInput.files[0];
				if (!f) {
					e.preventDefault();
					alert('Please choose an image before analyzing');
					return;
				}
				// Let the form submit normally to /predict, show loading
				showLoading(true);
			});
		}

		if (resetBtn) {
			resetBtn.addEventListener('click', function () {
				if (dzFileInput) {
					dzFileInput.value = '';
				}
				// hide loading/preview if any
				showLoading(false);
			});
		}
	} catch (err) {
		console.debug('Dropzone init failed', err);
	}

	// Only run if Chart is available and canvas exists
	if (typeof Chart === 'undefined') return;

	// Fetch stats (fallback to sample data)
	fetch('/stats').then(r => r.json()).then(data => {
		try {
			// KPI numbers
			if (data.total !== undefined) document.getElementById('totalAnalyses').textContent = data.total;
			if (data.healthy !== undefined) document.getElementById('healthyCount').textContent = data.healthy;
			if (data.diseased !== undefined) document.getElementById('diseasedCount').textContent = data.diseased;
			if (data.accuracy !== undefined) document.getElementById('accuracyRate').textContent = data.accuracy;

			// Trend chart
			const trendCtx = document.getElementById('trendChart');
			if (trendCtx && data.trend && data.trend.labels) {
				new Chart(trendCtx.getContext('2d'), {
					type: 'line',
					data: { labels: data.trend.labels, datasets: [{ label: 'Analyses', data: data.trend.values, borderColor: '#6a8c2a', backgroundColor: 'rgba(106,140,42,0.08)', tension: 0.2, fill: true }] },
					options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
				});
			}

			// Donut chart
			const donutCtx = document.getElementById('donutChart');
			if (donutCtx && data.distribution) {
				const categoryColors = {
					apple: '#FF6B6B', banana: '#FFE66D', bellpepper: '#4ECDC4', carrot: '#FF8E53',
					cucumber: '#95E1D3', grape: '#A8E6CF', guava: '#FFB3BA', mango: '#FFDFBA',
					orange: '#FFA726', potato: '#D4A574', strawberry: '#FF69B4', tomato: '#FF6347',
					'non fruit/vegetable': '#999999'
				};
				const labels = data.distribution.labels.map(label => label.toLowerCase() === 'unknown' ? 'Non Fruit/Vegetable' : label);
				const bgColors = labels.map(label => categoryColors[label.toLowerCase()] || '#999999');
				new Chart(donutCtx.getContext('2d'), {
					type: 'doughnut',
					data: { labels: labels, datasets: [{ data: data.distribution.values, backgroundColor: bgColors }] },
					options: { 
						plugins: { 
							legend: { 
								position: 'bottom',
								align: 'center',
								labels: {
									padding: 15,
									usePointStyle: true,
									pointStyle: 'circle',
									font: { size: 12 }
								}
							} 
						}, 
						cutout: '60%',
						layout: {
							padding: {
								bottom: 10
							}
						}
					}
				});
				// Hide custom legend
				const customLegend = donutCtx.closest('.chart-card').querySelector('.chart-legend');
				if (customLegend) customLegend.style.display = 'none';
			}
		} catch (err) {
			console.error('Error rendering charts', err);
		}
	}).catch(err => {
		// If /stats fails, render basic sample charts
		console.warn('Failed to fetch /stats:', err);
	});
});