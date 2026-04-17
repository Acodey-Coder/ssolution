import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-top-nav',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './top-nav.html',
  styleUrl: './top-nav.css',
})
export class TopNavComponent {
  public isMenuOpen = false;

  constructor(public router: Router) {}

  public toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  public closeMenu(): void {
    this.isMenuOpen = false;
  }
}
