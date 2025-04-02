import {
  Vector3,
  MeshBasicMaterial,
  SphereGeometry,
  Mesh,
  Scene
} from 'three'
import { ExplosionParticle } from './interfaces';
import { particleLife, particleSpeed } from './constants';

// Collection to track active particles
export const explosionParticles: ExplosionParticle[] = [];

/**
 * Creates an audio fade effect for game sounds
 */
export function playAudioWithFade(audioElement: HTMLAudioElement, fadeInDuration: number, fadeOutStart: number, duration: number) {
  if (!audioElement) return;
  
  audioElement.volume = 0;
  audioElement.play();
  
  // Fade in
  let startTime = Date.now();
  
  const fadeInterval = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    
    // Fade in phase
    if (elapsed < fadeInDuration) {
      audioElement.volume = Math.min(elapsed / fadeInDuration, 1);
    } 
    // Fade out phase
    else if (elapsed >= fadeOutStart && elapsed < duration) {
      const fadeOutDuration = duration - fadeOutStart;
      const fadeOutElapsed = elapsed - fadeOutStart;
      audioElement.volume = Math.max(1 - (fadeOutElapsed / fadeOutDuration), 0);
    } 
    // End
    else if (elapsed >= duration) {
      audioElement.pause();
      audioElement.currentTime = 0;
      clearInterval(fadeInterval);
    }
  }, 50);
}

/**
 * Creates an explosion effect at the specified position
 */
export function createExplosion(position: Vector3, scene: Scene) {
  const numParticles = 20;
  
  for (let i = 0; i < numParticles; i++) {
    // Create a particle
    const geometry = new SphereGeometry(0.05, 8, 8);
    const material = new MeshBasicMaterial({ color: 0xffff00 });
    const particle = new Mesh(geometry, material);
    
    // Set position
    particle.position.copy(position);
    
    // Random velocity
    const velocity = new Vector3(
      (Math.random() - 0.5) * particleSpeed,
      (Math.random() - 0.5) * particleSpeed,
      (Math.random() - 0.5) * particleSpeed
    );
    
    // Add to scene and tracking array
    scene.add(particle);
    explosionParticles.push({
      mesh: particle,
      velocity,
      timeCreated: Date.now()
    });
  }
}

/**
 * Updates all explosion particles
 */
export function updateParticles(scene: Scene) {
  const currentTime = Date.now();
  
  // Update each particle
  for (let i = explosionParticles.length - 1; i >= 0; i--) {
    const particle = explosionParticles[i];
    
    // Check if particle should be removed
    if (currentTime - particle.timeCreated > particleLife * 1000) {
      scene.remove(particle.mesh);
      explosionParticles.splice(i, 1);
      continue;
    }
    
    // Update position
    particle.mesh.position.add(particle.velocity);
    
    // Fade out
    const lifeRatio = 1 - ((currentTime - particle.timeCreated) / (particleLife * 1000));
    const scale = lifeRatio * 0.05;
    particle.mesh.scale.set(scale, scale, scale);
  }
} 