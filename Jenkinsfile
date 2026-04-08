pipeline {
    agent any

    environment {
        APP_NAME = "backend-app"
        IMAGE_TAG = "${BUILD_NUMBER}"
        COMPOSE_FILE = "docker-compose.yml"
    }

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Image') {
            steps {
                sh '''
                docker build -t $APP_NAME:$IMAGE_TAG .
                '''
            }
        }

        stage('Get Previous Version') {
            steps {
                script {
                    sh '''
                    PREV_TAG=$(docker ps -a --filter "name=backend" --format "{{.Image}}" | cut -d: -f2)
                    echo $PREV_TAG > prev_tag.txt || true
                    echo "Previous version: $PREV_TAG"
                    '''
                }
            }
        }

        stage('Deploy via Docker Compose') {
            steps {
                sh '''
                export APP_NAME=$APP_NAME
                export IMAGE_TAG=$IMAGE_TAG

                docker-compose -f $COMPOSE_FILE down || true
                docker-compose -f $COMPOSE_FILE up -d
                '''
            }
        }

        stage('Health Check') {
            steps {
                script {
                    echo "Waiting for application to be ready..."

                    retry(5) {
                        sleep 5
                        sh 'curl -f http://localhost:5000/api/hello'
                    }
                }
            }
        }
    }

    post {
        failure {
            echo '❌ Deployment failed - Rolling back...'

            sh '''
            PREV_TAG=$(cat prev_tag.txt)

            if [ ! -z "$PREV_TAG" ]; then
                echo "Rolling back to version: $PREV_TAG"

                export APP_NAME=$APP_NAME
                export IMAGE_TAG=$PREV_TAG

                docker-compose down || true
                docker-compose up -d
            else
                echo "No previous version available"
            fi
            '''
        }

        success {
            echo '✅ Deployment successful'
        }

        always {
            echo '🧹 Cleaning unused images'
            sh 'docker image prune -f || true'
        }
    }
}
