import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonModal } from '@ionic/angular/standalone';

@Component({
  selector: 'app-expense-form',
  templateUrl: './expense-form.page.html',
  styleUrls: ['./expense-form.page.scss'],
  standalone: true,
  imports: [IonModal, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class ExpenseFormPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
