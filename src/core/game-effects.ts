import {
  Vector3,
  MeshBasicMaterial,
  SphereGeometry,
  Mesh,
  Scene
} from 'three'
import { ExplosionParticle } from '../types/interfaces';
import { particleLife, particleSpeed } from '../constants/constants';

export const explosionParticles: ExplosionParticle[] = [];

export function playAudioWithFade(audioElement: HTMLAudioElement, fadeInDuration: number, fadeOutStart: number, duration: number) {
  if (!audioElement) return;
  audioElement.volume = 0;
  audioElement.play();
  const startTime = Date.now();
  const fadeInterval = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    if (elapsed < fadeInDuration) {
      audioElement.volume = Math.min(elapsed / fadeInDuration, 1);
    } else if (elapsed >= fadeOutStart && elapsed < duration) {
      const fadeOutDuration = duration - fadeOutStart;
      audioElement.volume = Math.max(1 - ((elapsed - fadeOutStart) / fadeOutDuration), 0);
    } else if (elapsed >= duration) {
      audioElement.pause();
      audioElement.currentTime = 0;
      clearInterval(fadeInterval);
    }
  }, 50);
}

export function createExplosion(position: Vector3, scene: Scene) {
  const numParticles = 20;
  const geometry = new SphereGeometry(0.05, 8, 8);
  const material = new MeshBasicMaterial({ color: 0xffff00 });
  const velocity = new Vector3();

  for (let i = 0; i < numParticles; i++) {
    const particle = new Mesh(geometry, material);
    particle.position.copy(position);
    velocity.set(
      (Math.random() - 0.5) * particleSpeed,
      (Math.random() - 0.5) * particleSpeed,
      (Math.random() - 0.5) * particleSpeed
    );
    scene.add(particle);
    explosionParticles.push({
      mesh: particle,
      velocity: velocity.clone(),
      timeCreated: Date.now()
    });
  }
}

export function updateParticles(scene: Scene) {
  const currentTime = Date.now();
  for (let i = explosionParticles.length - 1; i >= 0; i--) {
    const particle = explosionParticles[i];
    if (currentTime - particle.timeCreated > particleLife * 1000) {
      scene.remove(particle.mesh);
      explosionParticles.splice(i, 1);
      continue;
    }
    particle.mesh.position.add(particle.velocity);
    const lifeRatio = 1 - ((currentTime - particle.timeCreated) / (particleLife * 1000));
    const scale = lifeRatio * 0.05;
    particle.mesh.scale.set(scale, scale, scale);
  }
}