class AnimationManager {
    constructor(shadowRoot, exercises) {
        this.shadowRoot = shadowRoot;
        this.exercises = exercises;
        this.isExerciseActive = false;
        this.currentExercise = null;
        this.phase = 0;
        this.animationFrame = null;
        this.lastTimestamp = 0;
        this.currentScale = 1;
        this.minScale = 1;
        this.maxScale = 5;
        this.lastPhaseType = null;
        this.cycleCount = 0;
    }

    breathingAnimation(timestamp) {
        if (!this.isExerciseActive) {
            console.log('Breathing animation stopped');
            return;
        }

        const outline = this.shadowRoot.getElementById('breather-extension-overlay-circle');
        const circle = this.shadowRoot.getElementById('breather-extension-circle');
        const instruction = this.shadowRoot.getElementById('breather-extension-instruction');
        const countdownTimer = this.shadowRoot.getElementById('breather-extension-timer');

        if (!circle || !instruction || !countdownTimer) {
            console.error('Required elements not found in Shadow DOM');
            return;
        }

        if (!this.lastTimestamp) {
            this.lastTimestamp = timestamp;
        }

        const elapsed = timestamp - this.lastTimestamp;
        const currentPhase = this.exercises[this.currentExercise].phases[this.phase];
        const phaseDuration = currentPhase.duration;
        const progress = Math.min(elapsed / phaseDuration, 1);

        // Update circle animation
        this.currentScale = this.getCircleScale(currentPhase.type, progress);
        circle.style.transform = `scale(${this.currentScale})`;
        circle.style.opacity = currentPhase.type === 'inhale' ? 0.8 + (0.2 * progress) : 1 - (0.3 * progress);

        // Update instruction and countdown
        instruction.textContent = currentPhase.instruction;
        const remaining = Math.ceil((phaseDuration - elapsed) / 1000);
        countdownTimer.textContent = remaining > 0 ? `${remaining}` : '';

        if (progress < 1) {
            this.animationFrame = requestAnimationFrame(this.breathingAnimation.bind(this));
        } else {
            this.lastPhaseType = currentPhase.type;
            this.phase = (this.phase + 1) % this.exercises[this.currentExercise].phases.length;
            if (this.phase === 0) {
                this.cycleCount++;
                this.updateCycleCount();
            }
            this.lastTimestamp = timestamp;
            this.breathingAnimation(timestamp);
        }
    }

    getCircleScale(phaseType, progress) {
        switch (phaseType) {
            case 'inhale':
                return this.minScale + (this.maxScale - this.minScale) * progress;
            case 'exhale':
                return this.maxScale - (this.maxScale - this.minScale) * progress;
            case 'hold':
                // Maintain the scale from the end of the previous phase
                return this.lastPhaseType === 'inhale' ? this.maxScale : this.minScale;
            default:
                return 1;
        }
    }

    startAnimation(exercise) {
        this.currentExercise = exercise;
        this.isExerciseActive = true;
        this.phase = 0;
        this.lastTimestamp = 0;
        this.lastPhaseType = null;
        this.resetCircle();
        this.animationFrame = requestAnimationFrame(this.breathingAnimation.bind(this));
        this.cycleCount = 0;
        this.updateCycleCount();
    }

    stopAnimation() {
        console.log('AnimationManager.stopAnimation called');
        this.isExerciseActive = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        this.resetCircle();
        this.updateUI('Exercise stopped', '');
        this.cycleCount = 0;
        this.updateCycleCount();
    }

    changeExercise(exercise) {
        this.currentExercise = exercise;
        this.phase = 0;
        this.lastPhaseType = null;
        this.resetCircle();
        this.updateCycleCount();
        if (this.isExerciseActive) {
            this.breathingAnimation();
        }
    }

    resetCircle() {
        const countdownTimer = this.shadowRoot.getElementById('breather-extension-timer');
        if (countdownTimer) {
            countdownTimer.textContent = '';
        }
        const circle = this.shadowRoot.getElementById('breather-extension-circle');
        if (circle) {
            circle.style.transition = 'none';
            circle.style.transform = 'scale(1)';
            circle.style.opacity = '1';
        }
    }

    updateUI(instruction, countdown) {
        const instructionEl = this.shadowRoot.getElementById('breather-extension-instruction');
        const countdownEl = this.shadowRoot.getElementById('breather-extension-timer');
        if (instructionEl) instructionEl.textContent = instruction;
        if (countdownEl) countdownEl.textContent = countdown;
    }

    updateCycleCount() {
        const infoElement = this.shadowRoot.getElementById('breather-extension-info');
        if (infoElement) {
            const exerciseName = this.exercises[this.currentExercise].name;
            infoElement.textContent = `${this.cycleCount} '${exerciseName}' ${this.cycleCount === 1 ? 'cycle' : 'cycles'}`;
        }
    }
}

window.AnimationManager = AnimationManager;