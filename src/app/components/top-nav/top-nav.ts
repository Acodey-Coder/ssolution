import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-top-nav',
  imports: [RouterLink, NgIf],
  templateUrl: './top-nav.html',
  styleUrl: './top-nav.css',
})
export class TopNav {
  isMenuOpen = false;

  constructor(public router: Router) {}

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
  }
}
