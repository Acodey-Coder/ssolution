import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TopNav } from './components/top-nav/top-nav';
import { Footer } from './components/footer/footer';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TopNav, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('ssolution');
}
